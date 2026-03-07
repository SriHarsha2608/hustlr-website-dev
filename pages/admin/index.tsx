// pages/admin/index.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { SupabaseVettingData } from "@/src/lib/schemas/formSchema";
import Nav from "@/src/components/Nav";
import { Skeleton } from "@/components/ui/skeleton";
import { verifyToken } from "@/src/lib/jwt";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { ArrowLeft } from "lucide-react";
import { ScoreBadge } from "@/src/components/admin/ScoreBreakdown";

// add getServerSideProps to check for admin session
export async function getServerSideProps(context: any) {
  const { req } = context;
  const token = req.cookies?.session;
  if (!token) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }
  const payload = verifyToken(token);
  console.log("got this JWT here:", payload);
  const role =
    payload && typeof payload === "object" && typeof payload.role === "string"
      ? payload.role
      : "user";
  const email =
    payload && typeof payload === "object" && typeof payload.email === "string"
      ? payload.email
      : undefined;
  if (role !== "admin" || !email) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: { email, jwtToken: token },
  };
}

export default function AdminPanel({
  email,
  jwtToken,
}: {
  email: string;
  jwtToken: string;
}) {
  const [applications, setApplications] = useState<SupabaseVettingData[]>([]);
  const [filtered, setFiltered] = useState<SupabaseVettingData[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/getAllApplications", {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setApplications(data.data);
          setFiltered(data.data);
        } else {
          toast.error("Failed to fetch applications");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...applications];

    if (statusFilter !== "all" && statusFilter !== null) {
      if (statusFilter === "awaiting_review") {
        result = result.filter(
          (app) =>
            app.status === "under_review" ||
            app.status === "round_2_under_review"
        );
      } else {
        result = result.filter((app) => app.status === statusFilter);
      }
    }

    if (searchTerm) {
      result = result.filter((app) =>
        app.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFiltered(result);
  }, [statusFilter, searchTerm, applications]);
  const router = useRouter();

  return (
    <>
      <Nav />
      <main className="bg-white min-h-screen pt-32">
        <div className="p-10 max-w-screen-xl mx-auto">
          <Button
            // href={`/get-started/student/application`}
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/get-started/");
            }}
            variant={"outline"}
            className="self-start font-sans font-medium text-sm px-3 py-2 text-black bg-white border border-black/15 hover:bg-gray-500/20 transition-colors rounded flex items-center justify-center gap-2 mb-4"
          >
            <ArrowLeft className="size-5" />
            Sign Out
          </Button>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-2xl">Admin Panel</CardTitle>
              <CardDescription className="text-base  text-gray-700">
                Logged in as {email}
              </CardDescription>
            </CardHeader>

            <CardContent className="font-sans">
              <div className="flex gap-4 mb-6">
                <Input
                  placeholder="Search by email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select
                  onValueChange={(val) =>
                    setStatusFilter(val === "" ? null : val)
                  }
                  value={statusFilter ?? "all"}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="awaiting_review">
                      Awaiting Review
                    </SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="round_2_eligible">
                      Round 2 Eligible
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="border-b">
                    <tr>
                      <th className="py-2">Email</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Stage</th>
                      <th>View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      // Show skeleton rows while loading
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b">
                          <td className="py-2">
                            <Skeleton className="h-4 w-32" />
                          </td>
                          <td className="py-2">
                            <Skeleton className="h-4 w-24" />
                          </td>
                          <td className="py-2">
                            <Skeleton className="h-4 w-16" />
                          </td>
                          <td className="py-2">
                            <Skeleton className="h-4 w-12" />
                          </td>
                          <td className="py-2">
                            <Skeleton className="h-4 w-20" />
                          </td>
                        </tr>
                      ))
                    ) : filtered.length > 0 ? (
                      filtered.map((app, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2">{app?.name || app.email}</td>
                          <td className="py-2 capitalize">
                            {app.status ?? "Not Set"}
                          </td>
                          <td className="py-2">
                            <ScoreBadge score={app.final_score} />
                          </td>
                          <td className="py-2">{app.currentStage ?? 0}</td>
                          <td className="py-2">
                            <a
                              href={`/admin/applications/${encodeURIComponent(
                                app.email
                              )}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View Details
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-4 text-center text-gray-500"
                        >
                          No applications found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
