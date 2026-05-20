import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PenLine, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateReview } from "@/hooks/use-reviews";
import { useAuth } from "@/hooks/use-auth";
import { insertReviewSchema } from "@shared/schema";
import { useLocation } from "wouter";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import InteractiveStarRating from "../shared/InteractiveStarRating";

const formSchema = insertReviewSchema.extend({
  rating: z.coerce.number().min(1, "Please select a rating").max(5),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateReviewDialog({ movieId, movieTitle }: { movieId: number, movieTitle: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createReview = useCreateReview();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      movieId: movieId,
      authorName: user?.name || "",
      reviewText: "",
      rating: 0,
    },
  });

  function onSubmit(data: FormValues) {
    createReview.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Review Published",
          description: "Thank you for sharing your thoughts!",
        });
        setOpen(false);
        form.reset({
          movieId: movieId,
          authorName: "",
          reviewText: "",
          rating: 0,
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all">
          <PenLine className="w-5 h-5" />
          <span>Write a Review</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-border bg-card/95 backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Review {movieTitle}</DialogTitle>
          <DialogDescription>
            {user ? "Share your thoughts and rate this movie." : "Sign in to share your thoughts and rate this movie."}
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6">
            <div className="bg-secondary/50 w-16 h-16 rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Sign in required</h3>
              <p className="text-muted-foreground text-sm">You need to be logged in to write a review.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => {
                  setOpen(false);
                  setLocation("/login");
                }}
                className="flex-1 px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setLocation("/signup");
                }}
                className="flex-1 px-6 py-3 rounded-xl font-bold bg-secondary text-foreground border border-border hover:bg-secondary/80 transition-all"
              >
                Sign Up
              </button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-2">
            
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="flex flex-col items-center justify-center py-4 bg-background/50 rounded-xl border border-border">
                  <FormLabel className="text-base mb-2">Your Rating</FormLabel>
                  <FormControl>
                    <InteractiveStarRating 
                      value={field.value} 
                      onChange={field.onChange} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Doe" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reviewText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What did you think of the movie?" 
                      className="resize-none h-32 bg-background" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={createReview.isLoading}
                className="w-full px-6 py-3.5 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {createReview.isLoading ? "Publishing..." : "Publish Review"}
              </button>
            </div>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
