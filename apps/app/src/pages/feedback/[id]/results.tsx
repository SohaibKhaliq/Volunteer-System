import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function SurveyResultsRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to admin results page
    if (id) navigate(`/admin/feedback/${id}/results`);
    else navigate('/admin/feedback');
  }, [id]);

  return <div className="p-6">Redirecting to admin...</div>;
}
