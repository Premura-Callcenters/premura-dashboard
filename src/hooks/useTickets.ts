import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Ticket, TicketPriority, TicketStatus } from '../types';

interface UseTicketsOptions {
  assignedTo?: string;   // filter to specific employee (undefined = all)
  isSuperAdmin?: boolean;
}

export function useTickets({ assignedTo, isSuperAdmin }: UseTicketsOptions = {}) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchTickets() {
    setLoading(true);
    let query = supabase
      .from('tickets')
      .select(`
        *,
        creator:employees!tickets_created_by_fkey(id, name, email, department, role),
        assignee:employees!tickets_assigned_to_fkey(id, name, email, department, role)
      `)
      .order('created_at', { ascending: false });

    if (!isSuperAdmin && assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    } else if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setTickets(data ?? []);
    }
    setLoading(false);
  }

  async function createTicket(values: {
    title: string;
    description: string;
    assigned_to: string;
    priority: TicketPriority;
    deadline: string | null;
    created_by: string;
  }) {
    const { data, error } = await supabase
      .from('tickets')
      .insert({ ...values, status: 'open' })
      .select(`
        *,
        creator:employees!tickets_created_by_fkey(id, name, email, department, role),
        assignee:employees!tickets_assigned_to_fkey(id, name, email, department, role)
      `)
      .single();
    if (error) return { error: error.message };
    setTickets((prev) => [data, ...prev]);
    return { error: null };
  }

  async function updateTicket(id: string, values: {
    priority?: TicketPriority;
    deadline?: string | null;
    status?: TicketStatus;
    assigned_to?: string;
  }) {
    const { data, error } = await supabase
      .from('tickets')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        creator:employees!tickets_created_by_fkey(id, name, email, department, role),
        assignee:employees!tickets_assigned_to_fkey(id, name, email, department, role)
      `)
      .single();
    if (error) return { error: error.message };
    setTickets((prev) => prev.map((t) => (t.id === id ? data : t)));
    return { error: null };
  }

  async function reassignTicket(
    ticketId: string,
    newAssigneeId: string,
    changedById: string,
    oldAssigneeId: string | null,
    note: string,
  ) {
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ assigned_to: newAssigneeId, updated_at: new Date().toISOString() })
      .eq('id', ticketId);
    if (updateError) return { error: updateError.message };

    // Record history
    await supabase.from('ticket_history').insert({
      ticket_id: ticketId,
      changed_by: changedById,
      from_employee: oldAssigneeId,
      to_employee: newAssigneeId,
      note,
    });

    await fetchTickets();
    return { error: null };
  }

  async function deleteTicket(id: string) {
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) return { error: error.message };
    setTickets((prev) => prev.filter((t) => t.id !== id));
    return { error: null };
  }

  useEffect(() => {
    fetchTickets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedTo, isSuperAdmin]);

  return {
    tickets,
    loading,
    error,
    createTicket,
    updateTicket,
    reassignTicket,
    deleteTicket,
    refetch: fetchTickets,
  };
}
