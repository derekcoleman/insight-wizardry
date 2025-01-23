import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ContentTopic {
  title: string;
  description: string;
  targetKeywords: string[];
  estimatedImpact: string;
  priority: 'high' | 'medium' | 'low';
  pageUrl: string;
  currentMetrics?: {
    traffic?: number;
    conversions?: number;
    revenue?: number;
    [key: string]: any;
  } | null;
  implementationSteps: string[];
  conversionStrategy: string;
}

interface ContentTopicCardProps {
  topic: ContentTopic;
}

export function ContentTopicCard({ topic }: ContentTopicCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-lg">{topic.title}</CardTitle>
          <Badge variant={
            topic.priority === 'high' ? 'destructive' :
            topic.priority === 'medium' ? 'default' :
            'secondary'
          }>
            {topic.priority}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {topic.pageUrl === 'new' ? 'New Content' : `Optimizing: ${topic.pageUrl}`}
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="description">
            <AccordionTrigger>Description & Analysis</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {topic.description}
              </p>
            </AccordionContent>
          </AccordionItem>

          {topic.currentMetrics && (
            <AccordionItem value="metrics">
              <AccordionTrigger>Current Performance</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {Object.entries(topic.currentMetrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-sm font-medium">
                        {typeof value === 'number' ? value.toLocaleString() : value}
                      </span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="keywords">
            <AccordionTrigger>Target Keywords</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-1">
                {topic.targetKeywords.map((keyword, index) => (
                  <Badge key={index} variant="outline">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="implementation">
            <AccordionTrigger>Implementation Steps</AccordionTrigger>
            <AccordionContent>
              <ol className="list-decimal list-inside space-y-2">
                {topic.implementationSteps.map((step, index) => (
                  <li key={index} className="text-sm">
                    {step}
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="conversion">
            <AccordionTrigger>Conversion Strategy</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {topic.conversionStrategy}
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="impact">
            <AccordionTrigger>Estimated Impact</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {topic.estimatedImpact}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}