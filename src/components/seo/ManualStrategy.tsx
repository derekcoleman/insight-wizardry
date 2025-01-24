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
}

export function ManualStrategy() {
  const [topics, setTopics] = useState<ManualTopic[]>([]);
  const [newTopic, setNewTopic] = useState<ManualTopic>({
    title: '',
    description: '',
    targetKeywords: '',
    priority: 'medium'
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.title || !newTopic.description || !newTopic.targetKeywords) {
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
      priority: 'medium'
    });
    toast({
      title: "Topic Added",
      description: "Your content topic has been added to the strategy.",
    });
  };

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
        {topics.map((topic, index) => (
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