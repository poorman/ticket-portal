import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedPage from '../components/layout/AnimatedPage';
import TicketForm from '../components/tickets/TicketForm';

export default function SubmitPage() {
  const navigate = useNavigate();

  return (
    <AnimatedPage>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 mb-6 no-underline">
          <ArrowLeft size={14} />
          Back to home
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Submit a Ticket</h1>
          <p className="text-gray-500 mt-1">Describe your issue and we'll get back to you.</p>
        </div>

        <div className="card">
          <TicketForm
            onSuccess={() => {
              setTimeout(() => navigate('/'), 2000);
            }}
          />
        </div>
      </div>
    </AnimatedPage>
  );
}
