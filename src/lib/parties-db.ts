import { supabase } from './supabase';
import { Party, PartyStatus } from '@/types/party';

// Helper to transform DB result to Party type
const transformParty = (row: any): Party => {
    return {
        id: row.id,
        title: row.title,
        name: row.name,
        description: row.description,
        date: row.date,
        time: row.time,
        budget: row.budget,
        rating: row.rating,
        status: row.status as PartyStatus,
        created_by: row.created_by,
        committee_id: row.committee_id,
        image_url: row.image_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
        created_by_name: row.profiles?.name || 'Unknown',
        committee_name: row.master_committees?.name,
    };
};

export async function getParties(status?: PartyStatus, userId?: string): Promise<Party[]> {
    // 1. Fetch parties without the failing join
    let query = supabase
        .from('parties')
        .select(`
            *,
            profiles:created_by (name)
        `);

    if (status) {
        query = query.eq('status', status);
    }

    if (userId) {
        query = query.eq('created_by', userId);
    }

    const { data: partiesData, error } = await query.order('date', { ascending: false });

    if (error) {
        console.error('Error fetching parties:', error);
        return [];
    }

    // 2. Fetch all committees to map names manually (DB currently lacks FK for auto-join)
    const { data: committeesData } = await supabase
        .from('master_committees')
        .select('id, name');

    const committeeMap = new Map<string, string>();
    if (committeesData) {
        committeesData.forEach(c => committeeMap.set(c.id, c.name));
    }

    // 3. Transform and populate committee_name
    return partiesData.map(row => {
        const party = transformParty(row);
        if (party.committee_id && committeeMap.has(party.committee_id)) {
            party.committee_name = committeeMap.get(party.committee_id);
        }
        return party;
    });
}

export async function getParty(id: string): Promise<Party | null> {
    const { data, error } = await supabase
        .from('parties')
        .select(`
            *,
            profiles:created_by (name)
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching party:', error);
        return null;
    }

    // Fetch participants separately or via join if relation exists
    // For now, let's keep it simple and maybe fetch participants in a second call
    const party = transformParty(data);

    // Fetch committee name manually if possible (since no FK constraint might exist yet for auto-join)
    if (party.committee_id) {
        const { data: committeeData } = await supabase
            .from('master_committees')
            .select('name')
            .eq('id', party.committee_id)
            .single();

        if (committeeData) {
            party.committee_name = committeeData.name;
        }
    }

    // Fetch participants
    const { data: participantsData } = await supabase
        .from('party_participants')
        .select(`
            member_id,
            jc_members (name, avatar_url)
        `)
        .eq('party_id', id);

    if (participantsData) {
        party.participants = participantsData.map((p: any) => ({
            member_id: p.member_id,
            member_name: p.jc_members?.name || 'Unknown',
            member_avatar_url: p.jc_members?.avatar_url
        }));
    }

    return party;
}

export type CreatePartyInput = Omit<Party, 'id' | 'created_at' | 'updated_at' | 'created_by_name' | 'committee_name' | 'participant_count' | 'participants'> & {
    participant_ids?: string[];
    image_file?: File;
};

export async function createParty(input: CreatePartyInput): Promise<{ data: Party | null; error: any }> {
    // 1. Upload Image if exists
    let imageUrl = input.image_url;

    if (input.image_file) {
        const fileExt = input.image_file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `parties/${fileName}`; // Assuming folder structure or just root

        const { error: uploadError } = await supabase.storage
            .from('party-photos')
            .upload(filePath, input.image_file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            return { data: null, error: uploadError };
        }

        const { data: { publicUrl } } = supabase.storage
            .from('party-photos')
            .getPublicUrl(filePath);

        imageUrl = publicUrl;
    }

    // 2. Insert Party
    const partyData = {
        title: input.title,
        name: input.name,
        description: input.description,
        url: input.url,
        address: input.address,
        date: input.date,
        time: input.time,
        budget: input.budget,
        rating: input.rating,
        status: input.status,
        created_by: input.created_by,
        committee_id: input.committee_id,
        image_url: imageUrl,
    };

    // Correcting plan: I need to add image_url column to parties table.
    // I will write a new migration file for this correction or just insert it now.

    const { data, error } = await supabase
        .from('parties')
        .insert([partyData]) // This will fail if no image_url column if I define it in types but not DB
        .select()
        .single();

    if (error) {
        return { data: null, error };
    }

    // 3. Insert Participants
    if (input.participant_ids && input.participant_ids.length > 0) {
        const participants = input.participant_ids.map(mid => ({
            party_id: data.id,
            member_id: mid
        }));

        const { error: partError } = await supabase
            .from('party_participants')
            .insert(participants);

        if (partError) {
            console.error('Error inserting participants:', partError);
            // Non-fatal, return party but log error
        }
    }

    return { data: transformParty(data), error: null };
}

export type UpdatePartyInput = Partial<CreatePartyInput> & { id: string };

export async function updateParty(input: UpdatePartyInput): Promise<{ data: Party | null; error: any }> {
    // 1. Upload Image if exists (new image)
    let imageUrl = input.image_url;

    if (input.image_file) {
        const fileExt = input.image_file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `parties/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('party-photos')
            .upload(filePath, input.image_file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            return { data: null, error: uploadError };
        }

        const { data: { publicUrl } } = supabase.storage
            .from('party-photos')
            .getPublicUrl(filePath);

        imageUrl = publicUrl;
    }

    // 2. Update Party
    const partyData: any = {
        updated_at: new Date().toISOString(),
    };
    if (input.title !== undefined) partyData.title = input.title;
    if (input.name !== undefined) partyData.name = input.name;
    if (input.description !== undefined) partyData.description = input.description;
    if (input.url !== undefined) partyData.url = input.url;
    if (input.address !== undefined) partyData.address = input.address;
    if (input.date !== undefined) partyData.date = input.date;
    if (input.time !== undefined) partyData.time = input.time;
    if (input.budget !== undefined) partyData.budget = input.budget;
    if (input.rating !== undefined) partyData.rating = input.rating;
    if (input.status !== undefined) partyData.status = input.status;
    if (input.committee_id !== undefined) partyData.committee_id = input.committee_id;
    if (imageUrl !== undefined) partyData.image_url = imageUrl;

    const { data, error } = await supabase
        .from('parties')
        .update(partyData)
        .eq('id', input.id)
        .select()
        .single();

    if (error) {
        return { data: null, error };
    }

    // 3. Update Participants (Replace all logic or Add/Remove? commonly replace for simple UI)
    // For simplicity, if participant_ids is provided, delete old and insert new.
    if (input.participant_ids) {
        // Delete existing
        await supabase.from('party_participants').delete().eq('party_id', input.id);

        if (input.participant_ids.length > 0) {
            const participants = input.participant_ids.map(mid => ({
                party_id: input.id,
                member_id: mid
            }));

            const { error: partError } = await supabase
                .from('party_participants')
                .insert(participants);

            if (partError) {
                console.error('Error updating participants:', partError);
            }
        }
    }

    return { data: transformParty(data), error: null };
}

export async function deleteParty(id: string): Promise<{ error: any }> {
    // 1. Delete participants (cascade might handle this, but explicit is safer if no cascade)
    // Actually our schema likely has ON DELETE CASCADE for foreign keys? 
    // Let's assume yes or delete manually.
    await supabase.from('party_participants').delete().eq('party_id', id);

    // 2. Delete Party
    const { error } = await supabase
        .from('parties')
        .delete()
        .eq('id', id);

    return { error };
}
