import { getCurrentUser } from "@/lib/auth";
import { Trip, getTrips } from "@/services/trips";
import { createContext, useContext, useEffect, useState } from "react";

type User = {
  $id: string;
  name: string;
  email: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  setUser: (user: User) => void;
  currentTrip: Trip | null;
  setCurrentTrip: (trip: Trip | null) => void;
};

const toDateOnly = (iso: string) => iso.split("T")[0];

const pickCurrentTrip = (trips: Trip[]): Trip | null => {
  const today = toDateOnly(new Date().toISOString());
  const active =
    trips.find(
      (t) => toDateOnly(t.startDate) <= today && toDateOnly(t.endDate) >= today,
    ) ?? null;
  if (active) return active;
  return (
    trips
      .filter((t) => toDateOnly(t.startDate) > today)
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      )[0] ?? null
  );
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  currentTrip: null,
  setCurrentTrip: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(async (u) => {
        const typedUser = u as User;
        setUser(typedUser);
        if (typedUser) {
          const trips = await getTrips(typedUser.$id);
          setCurrentTrip(pickCurrentTrip(trips));
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, setUser, currentTrip, setCurrentTrip }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
