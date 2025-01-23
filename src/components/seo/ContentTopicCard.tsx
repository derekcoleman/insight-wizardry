import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ContentTopic {
  title: string;
  description: string;
  targetKeywords: string[];
  estimatedImpact: string;
  priority: 'high' | 'medium' | 'low';
}

interface ContentTopicCardProps {
  topic: ContentTopic;
}

export function ContentTopicCard({ topic }: ContentTopicCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{topic.title}</CardTitle>
          <Badge variant={
            topic.priority === 'high' ? 'destructive' :
            topic.priority === 'medium' ? 'default' :
            'secondary'
          }>
            {topic.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{topic.description}</p>
        <div className="space-y-2">
          <div>
            <span className="text-sm font-semibold">Target Keywords:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {topic.targetKeywords.map((keyword, index) => (
                <Badge key={index} variant="outline">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <span className="text-sm font-semibold">Estimated Impact:</span>
            <p className="text-sm text-muted-foreground">{topic.estimatedImpact}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}