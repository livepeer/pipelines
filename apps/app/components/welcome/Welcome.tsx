import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/design-system/components/ui/card";
import { cn } from "@repo/design-system/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function Welcome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to <span className="text-primary">Pipelines</span>
        </h1>
        <p className="text-muted-foreground max-w-[600px]">
          Your AI-powered pipeline management platform. Create, manage, and optimize your data pipelines with ease.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <Card className="group hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Create Pipeline
            </CardTitle>
            <CardDescription>
              Start building your first pipeline with our intuitive interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Design and configure your pipeline using our visual builder or code editor.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full group-hover:bg-primary/90">
              <Link href="/pipelines/new">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="group hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              View Documentation
            </CardTitle>
            <CardDescription>
              Learn how to use Pipelines effectively
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Explore our comprehensive documentation and guides to master pipeline management.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full group-hover:bg-primary/10">
              <Link href="/docs">
                Read Docs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 