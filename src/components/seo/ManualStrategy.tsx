import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";

interface ManualTopic {
  title: string;
  description: string;
  targetKeywords: string;
  priority: 'high' | 'medium' | 'low';
  targetAudience?: string;
  funnelStage?: 'awareness' | 'consideration' | 'decision';
}

export function ManualStrategy() {
  const [topics, setTopics] = useState<ManualTopic[]>([]);
  const [newTopic, setNewTopic] = useState<ManualTopic>({
    title: '',
    description: '',
    targetKeywords: '',
    priority: 'medium',
    targetAudience: '',
    funnelStage: 'awareness'
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.title || !newTopic.description || !newTopic.targetKeywords || !newTopic.targetAudience) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setTopics([...topics, newTopic]);
    setNewTopic({
      title: '',
      description: '',
      targetKeywords: '',
      priority: 'medium',
      targetAudience: '',
      funnelStage: 'awareness'
    });
    toast({
      title: "Topic Added",
      description: "Your content topic has been added to the strategy.",
    });
  };

  const recommendedTopics: ManualTopic[] = [
    {
      title: "Ultimate Guide to SEO Analytics",
      description: "Comprehensive guide covering key metrics, tools, and strategies for measuring SEO success",
      targetKeywords: "seo analytics, seo metrics, seo measurement",
      priority: "high",
      targetAudience: "Marketing Managers, SEO Specialists",
      funnelStage: "awareness"
    },
    {
      title: "ROI Calculator for SEO Investments",
      description: "Interactive tool to help businesses calculate potential returns on SEO investments",
      targetKeywords: "seo roi, seo investment calculator, seo returns",
      priority: "high",
      targetAudience: "Business Owners, Marketing Directors",
      funnelStage: "consideration"
    },
    {
      title: "Local SEO Success Stories",
      description: "Case studies of successful local businesses improving their search visibility",
      targetKeywords: "local seo examples, local seo case studies",
      priority: "medium",
      targetAudience: "Small Business Owners",
      funnelStage: "decision"
    },
    {
      title: "SEO for E-commerce Product Pages",
      description: "Best practices for optimizing e-commerce product pages for search engines",
      targetKeywords: "ecommerce seo, product page optimization",
      priority: "high",
      targetAudience: "E-commerce Managers",
      funnelStage: "consideration"
    },
    {
      title: "Voice Search Optimization Guide",
      description: "How to optimize content for voice search and virtual assistants",
      targetKeywords: "voice search seo, voice search optimization",
      priority: "medium",
      targetAudience: "Digital Marketers",
      funnelStage: "awareness"
    },
    {
      title: "SEO Audit Checklist Template",
      description: "Downloadable template for conducting comprehensive SEO audits",
      targetKeywords: "seo audit template, seo checklist",
      priority: "high",
      targetAudience: "SEO Consultants, In-house SEO Teams",
      funnelStage: "consideration"
    },
    {
      title: "Mobile SEO Implementation Guide",
      description: "Step-by-step guide to implementing mobile-first SEO strategies",
      targetKeywords: "mobile seo, mobile-first indexing",
      priority: "high",
      targetAudience: "Web Developers, SEO Specialists",
      funnelStage: "consideration"
    },
    {
      title: "International SEO Strategy Blueprint",
      description: "Complete guide to expanding SEO efforts globally",
      targetKeywords: "international seo, global seo strategy",
      priority: "medium",
      targetAudience: "Enterprise Marketing Teams",
      funnelStage: "decision"
    },
    {
      title: "SEO Tools Comparison Guide",
      description: "Detailed comparison of popular SEO tools and their features",
      targetKeywords: "seo tools comparison, best seo tools",
      priority: "medium",
      targetAudience: "Marketing Professionals",
      funnelStage: "consideration"
    },
    {
      title: "SEO ROI Case Studies",
      description: "Real-world examples of businesses achieving significant ROI through SEO",
      targetKeywords: "seo success stories, seo case studies",
      priority: "high",
      targetAudience: "C-Level Executives",
      funnelStage: "decision"
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Content Topic</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Topic Title</Label>
              <Input
                id="title"
                value={newTopic.title}
                onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                placeholder="Enter topic title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTopic.description}
                onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                placeholder="Enter topic description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                value={newTopic.targetAudience}
                onChange={(e) => setNewTopic({ ...newTopic, targetAudience: e.target.value })}
                placeholder="Enter target audience (e.g., Marketing Managers, Business Owners)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="funnelStage">Funnel Stage</Label>
              <Select
                value={newTopic.funnelStage}
                onValueChange={(value: 'awareness' | 'consideration' | 'decision') => 
                  setNewTopic({ ...newTopic, funnelStage: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select funnel stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="awareness">Awareness</SelectItem>
                  <SelectItem value="consideration">Consideration</SelectItem>
                  <SelectItem value="decision">Decision</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Target Keywords</Label>
              <Input
                id="keywords"
                value={newTopic.targetKeywords}
                onChange={(e) => setNewTopic({ ...newTopic, targetKeywords: e.target.value })}
                placeholder="Enter target keywords (comma separated)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newTopic.priority}
                onValueChange={(value: 'high' | 'medium' | 'low') => 
                  setNewTopic({ ...newTopic, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Add Topic
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...topics, ...recommendedTopics].map((topic, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{topic.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{topic.description}</p>
              <p className="text-sm mb-2">
                <span className="font-semibold">Keywords: </span>
                {topic.targetKeywords}
              </p>
              <p className="text-sm mb-2">
                <span className="font-semibold">Target Audience: </span>
                {topic.targetAudience}
              </p>
              <p className="text-sm mb-2">
                <span className="font-semibold">Funnel Stage: </span>
                {topic.funnelStage?.charAt(0).toUpperCase() + topic.funnelStage?.slice(1)}
              </p>
              <div className="flex items-center">
                <span className="text-sm font-semibold mr-2">Priority:</span>
                <span className={`text-sm ${
                  topic.priority === 'high' ? 'text-red-500' :
                  topic.priority === 'medium' ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {topic.priority.charAt(0).toUpperCase() + topic.priority.slice(1)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}