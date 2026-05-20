import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateMovie } from "@/hooks/use-movies";
import { insertMovieSchema } from "@shared/schema";

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

// Extend schema to coerce numbers
const formSchema = insertMovieSchema.extend({
  releaseYear: z.coerce.number().min(1888, "Year must be valid").max(2100),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateMovieDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createMovie = useCreateMovie();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      releaseYear: new Date().getFullYear(),
      genre: "",
      imageUrl: "",
    },
  });

  function onSubmit(data: FormValues) {
    createMovie.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Movie Added",
          description: "Your movie has been successfully added to the database.",
        });
        setOpen(false);
        form.reset();
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
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
          <Plus className="w-5 h-5" />
          <span>Add Movie</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-border bg-card/95 backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add a Movie</DialogTitle>
          <DialogDescription>
            Contribute to the FilmFusion database by adding a new title.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Movie Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Inception" {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="releaseYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Release Year</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Sci-Fi" {...field} className="bg-background" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poster Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} className="bg-background" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Synopsis</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the movie..." 
                      className="resize-none h-24 bg-background" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={createMovie.isLoading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {createMovie.isLoading ? "Adding..." : "Add Movie"}
              </button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
