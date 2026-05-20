import { Link, useLocation } from "wouter";
import { Clapperboard, LogIn, UserPlus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateMovieDialog from "../movies/CreateMovieDialog";
import { useAuth } from "@/hooks/use-auth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-[1.02]">
            <div className="bg-primary/20 p-2 rounded-xl text-primary ring-1 ring-primary/30 group-hover:ring-primary/60 transition-all">
              <Clapperboard className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              FilmFusion
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    size="sm"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    size="sm"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
            <CreateMovieDialog />
          </div>
        </div>
      </div>
    </nav>
  );
}
