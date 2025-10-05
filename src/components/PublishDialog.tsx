import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Copy, ExternalLink } from 'lucide-react';

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  htmlCode: string;
}

export const PublishDialog = ({ open, onOpenChange, htmlCode }: PublishDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const generateSlug = (title: string) => {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomSuffix}`;
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setPublishing(true);
    try {
      const slug = generateSlug(title);
      
      const { error } = await supabase
        .from('published_codes')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          html_content: htmlCode,
          slug: slug
        });

      if (error) throw error;

      const url = `${window.location.origin}/published/${slug}`;
      setPublishedUrl(url);
      toast.success('Code published successfully!');
    } catch (error) {
      console.error('Error publishing code:', error);
      toast.error('Failed to publish code');
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyUrl = () => {
    if (publishedUrl) {
      navigator.clipboard.writeText(publishedUrl);
      toast.success('URL copied to clipboard!');
    }
  };

  const handleOpenUrl = () => {
    if (publishedUrl) {
      window.open(publishedUrl, '_blank');
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPublishedUrl(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {publishedUrl ? 'Published Successfully!' : 'Publish Your Code'}
          </DialogTitle>
          <DialogDescription>
            {publishedUrl
              ? 'Your code is now live and ready to share'
              : 'Share your AI-generated code with a unique URL'}
          </DialogDescription>
        </DialogHeader>

        {publishedUrl ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input value={publishedUrl} readOnly className="flex-1" />
              <Button size="icon" variant="outline" onClick={handleCopyUrl}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleOpenUrl} className="flex-1 gap-2">
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </Button>
              <Button onClick={handleClose} variant="outline" className="flex-1">
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="My Awesome Project"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={publishing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={publishing}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handlePublish} 
                disabled={publishing || !title.trim()}
                className="flex-1"
              >
                {publishing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Publish
              </Button>
              <Button onClick={handleClose} variant="outline" disabled={publishing}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};