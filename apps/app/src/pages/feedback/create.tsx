import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function CreateSurveyRedirect() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to admin create page (preserve id if present)
    if (id) navigate(`/admin/feedback/create?id=${encodeURIComponent(id)}`);
    else navigate('/admin/feedback/create');
  }, [id]);

  return <div className="p-6">Redirecting to admin...</div>;
}
