import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PreviewPanel } from '@/components/PreviewPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function PublishedCode() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublishedCode = async () => {
      if (!slug) return;
      
      try {
        const { data, error } = await supabase
          .from('published_codes')
          .select('title, html_content')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        
        if (data) {
          setTitle(data.title);
          setHtmlContent(data.html_content);
        }
      } catch (err) {
        console.error('Error fetching published code:', err);
        setError('Failed to load published code');
      } finally {
        setLoading(false);
      }
    };

    fetchPublishedCode();
  }, [slug]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !htmlContent) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-lg text-muted-foreground">{error || 'Code not found'}</p>
        <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <PreviewPanel code={htmlContent} />
      </div>
    </div>
  );
}