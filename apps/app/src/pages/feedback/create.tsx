import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/atoms/use-toast';
import { useApp } from '@/providers/app-provider';

function emptyQuestion(id?: string) {
  return { id: id || `q_${Date.now()}`, question: '', type: 'short_text', options: [], required: false, scale: 5 };
}

export default function CreateSurvey() {
  const [params] = useSearchParams();
  const id = params.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useApp();

  const isAdmin = !!(
    user?.isAdmin ||
    user?.is_admin ||
    (user?.roles &&
      Array.isArray(user.roles) &&
      user.roles.some((r: any) => {
        const n = (r?.name || r?.role || '').toLowerCase();
        return n === 'admin' || n === 'organization_admin' || n === 'organization_manager';
  import React, { useEffect } from 'react';
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
              ...q
  }

