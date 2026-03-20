import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, BookOpen, CheckCircle, MessageSquare, FileText, Hash, Filter } from 'lucide-react';
import AnimatedPage from '../components/layout/AnimatedPage';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import TypeBadge from '../components/ui/TypeBadge';
import { useTicketStore } from '../store/ticketStore';
import type { SearchResult } from '../store/ticketStore';
import type { TicketStatus, TicketType } from '../types';
import { formatDateShort } from '../lib/ticket-utils';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<TicketType | ''>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const deepSearch = useTicketStore((s) => s.deepSearch);
  const tickets = useTicketStore((s) => s.tickets);
  const responses = useTicketStore((s) => s.responses);

  const performSearch = useCallback(async () => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    let res = await deepSearch(query);
    if (statusFilter) res = res.filter((r) => r.ticket.status === statusFilter);
    if (typeFilter) res = res.filter((r) => r.ticket.type === typeFilter);
    setResults(res);
  }, [query, statusFilter, typeFilter, deepSearch]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  const highlightMatch = (text: string, maxLen = 200) => {
    const truncated = text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
    if (!query.trim()) return truncated;
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const parts: { text: string; highlight: boolean }[] = [];
    let remaining = truncated;
    while (remaining.length > 0) {
      let earliest = -1;
      let earliestTerm = '';
      for (const term of terms) {
        const idx = remaining.toLowerCase().indexOf(term);
        if (idx !== -1 && (earliest === -1 || idx < earliest)) {
          earliest = idx;
          earliestTerm = term;
        }
      }
      if (earliest === -1) {
        parts.push({ text: remaining, highlight: false });
        break;
      }
      if (earliest > 0) parts.push({ text: remaining.slice(0, earliest), highlight: false });
      parts.push({ text: remaining.slice(earliest, earliest + earliestTerm.length), highlight: true });
      remaining = remaining.slice(earliest + earliestTerm.length);
    }
    return parts.map((p, i) =>
      p.highlight ? <mark key={i} className="bg-crane/30 text-white rounded px-0.5">{p.text}</mark> : p.text
    );
  };

  const matchLabel = (matchedIn: SearchResult['matchedIn']) => {
    const icons: Record<string, typeof Hash> = {
      ticketNumber: Hash,
      subject: FileText,
      description: FileText,
      response: MessageSquare,
    };
    return matchedIn.map((m) => {
      const Icon = icons[m] || FileText;
      return (
        <span key={m} className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-white/[0.04] rounded px-1.5 py-0.5">
          <Icon size={10} /> {m === 'ticketNumber' ? 'ID' : m}
        </span>
      );
    });
  };

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded bg-crane/10 mb-4">
            <BookOpen size={28} className="text-crane" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Knowledge Base</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Search through {tickets.length} tickets and {responses.filter((r) => !r.isInternal).length} responses.
            {resolvedCount > 0 && <> <CheckCircle size={12} className="inline text-emerald-500" /> {resolvedCount} resolved with solutions.</>}
          </p>
        </div>

        {/* Search */}
        <div className="glass-strong p-2 mb-6 glow-crane">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe your issue or search by keyword..."
              className="w-full pl-12 pr-4 py-4 bg-transparent text-white placeholder-gray-500 text-base focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Filter size={14} className="text-gray-600" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
            className="text-xs bg-white/[0.04] border border-white/[0.08] rounded px-3 py-1.5 text-gray-400 focus:outline-none focus:border-crane/30"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TicketType | '')}
            className="text-xs bg-white/[0.04] border border-white/[0.08] rounded px-3 py-1.5 text-gray-400 focus:outline-none focus:border-crane/30"
          >
            <option value="">All types</option>
            <option value="support">Support</option>
            <option value="bug">Bug</option>
            <option value="feature_request">Feature Request</option>
            <option value="general">General</option>
          </select>
          {query.trim().length >= 2 && (
            <span className="text-xs text-gray-600 ml-auto">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Results */}
        {query.trim().length >= 2 ? (
          <div className="space-y-3">
            {results.map((result, i) => (
              <motion.div
                key={result.ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={`/tickets/${result.ticket.id}?from=search`}
                  className="card card-hover block no-underline text-inherit"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-crane/70">{result.ticket.ticketNumber}</span>
                        <StatusBadge status={result.ticket.status} />
                        <PriorityBadge priority={result.ticket.priority} />
                        <TypeBadge type={result.ticket.type} />
                        {result.ticket.status === 'resolved' && (
                          <span className="badge bg-emerald-500/10 text-emerald-400">
                            <CheckCircle size={10} className="mr-1" /> Has solution
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-white mb-1">
                        {highlightMatch(result.ticket.subject, 120)}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                        {highlightMatch(result.ticket.description)}
                      </p>
                      {result.responseSnippet && (
                        <div className="text-xs text-gray-500 bg-white/[0.03] rounded px-3 py-2 border-l-2 border-crane/30">
                          <span className="text-gray-600 mr-1">Response match:</span>
                          {highlightMatch(result.responseSnippet, 150)}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {matchLabel(result.matchedIn)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 shrink-0">
                      {formatDateShort(result.ticket.createdAt)}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
            {results.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500">No matching tickets found.</p>
                <p className="text-sm text-gray-600 mt-1">Try different keywords or broaden your search.</p>
                <Link to="/submit" className="btn btn-primary mt-4 no-underline">
                  Submit a New Ticket
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-600 text-sm">Type at least 2 characters to search.</p>
            <p className="text-gray-600 text-xs mt-1">Search across ticket subjects, descriptions, and responses.</p>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
