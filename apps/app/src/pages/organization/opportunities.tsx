import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from '@/components/atoms/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigate } from 'react-router-dom';

export default function OrganizationOpportunities() {
  // Organization Opportunities management has been removed.
  // Keep this stub to avoid hard failures if something still imports it.
  return <Navigate to="/organization/events" replace />;
}

