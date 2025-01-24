import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutomatedStrategy } from "@/components/seo/AutomatedStrategy";
import { ManualStrategy } from "@/components/seo/ManualStrategy";

export default function SeoStrategy() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">SEO Content Strategy</h1>
      
      <Tabs defaultValue="automated" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="automated">Automated Strategy</TabsTrigger>
          <TabsTrigger value="manual">Manual Input</TabsTrigger>
        </TabsList>
        
        <TabsContent value="automated">
          <AutomatedStrategy />
        </TabsContent>
        
        <TabsContent value="manual">
          <ManualStrategy />
        </TabsContent>
      </Tabs>
    </div>
  );
}