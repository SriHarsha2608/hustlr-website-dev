import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FileMeta = {
  name: string;
  size: number;
  url: string;
};

const fileFields = ["resume", "transcript", "studentId"];

/** Fields already shown by the ScoreSection / ScoreBreakdown components */
const scoringFields = ["scores", "final_score", "scored_at", "scoring_cache"];

/** Pretty labels for known field keys */
const fieldLabels: Record<string, string> = {
  id: "ID",
  category: "Category",
  name: "Name",
  email: "Email",
  college: "College",
  dob: "Date of Birth",
  cgpa: "CGPA",
  year: "Year",
  linkedin: "LinkedIn",
  github: "GitHub",
  location: "Location",
  resume: "Resume",
  transcript: "Transcript",
  studentId: "Student ID",
  isComplete: "Complete",
  createdAt: "Created At",
  status: "Status",
  currentStage: "Current Stage",
  selectedProjectSanityId: "Selected Project",
  videoLink: "Video Link",
  otherLinks: "Other Links",
  projectDeadline: "Project Deadline",
  phone: "Phone",
  collegeEmail: "College Email",
  degree: "Degree",
  branch: "Branch",
  hasPublishedResearch: "Published Research?",
  researchPapers: "Research Papers",
  codeforcesRating: "Codeforces Rating",
  codeforcesUserId: "Codeforces ID",
  codechefRating: "CodeChef Rating",
  codechefUserId: "CodeChef ID",
  hasQualifiedCpCompetitions: "CP Competitions?",
  cpCompetitions: "CP Competitions",
  experiences: "Experiences",
  hackathons: "Hackathons",
  openSource: "Open Source",
  skills: "Skills",
  awards: "Awards",
  projects: "Projects",
};

function formatLabel(key: string): string {
  return fieldLabels[key] || key;
}

/** Render a link if the value looks like a URL */
function MaybeLink({ value }: { value: string }) {
  if (/^https?:\/\//i.test(value)) {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
        {value}
      </a>
    );
  }
  return <>{value}</>;
}

/** Render a skill badge */
function SkillBadge({ skill, proficiency }: { skill: string; proficiency: string }) {
  const colors: Record<string, string> = {
    Advanced: "bg-green-100 text-green-800",
    Intermediate: "bg-blue-100 text-blue-800",
    Beginner: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-1 mb-1 ${colors[proficiency] || "bg-gray-100 text-gray-700"}`}>
      {skill} · {proficiency}
    </span>
  );
}

/** Card for a hackathon entry */
function HackathonCard({ h, idx }: { h: Record<string, any>; idx: number }) {
  return (
    <div className="border rounded-lg p-3 mb-2 bg-gray-50">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold">{idx + 1}. {h.name || "Untitled"}</span>
        {h.placement && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{h.placement}</span>}
        {h.type && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">{h.type}</span>}
      </div>
      <div className="text-sm text-gray-600 mt-1">
        {h.role && <span>Role: {h.role}</span>}
        {h.teamSize && <span className="ml-3">Team: {h.teamSize}</span>}
      </div>
      {h.projectName && <p className="text-sm font-medium mt-1">{h.projectName}</p>}
      {h.techStack?.length > 0 && (
        <div className="mt-1">
          {h.techStack.map((t: string) => (
            <span key={t} className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded mr-1">{t}</span>
          ))}
        </div>
      )}
      {h.githubLink && (
        <p className="text-sm mt-1">
          <a href={h.githubLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{h.githubLink}</a>
        </p>
      )}
      {h.description && (
        <details className="mt-1">
          <summary className="text-xs text-gray-500 cursor-pointer">Show description</summary>
          <p className="text-sm text-gray-600 mt-1 whitespace-pre-line max-h-40 overflow-y-auto">{h.description}</p>
        </details>
      )}
    </div>
  );
}

/** Card for a project entry */
function ProjectCard({ p, idx }: { p: Record<string, any>; idx: number }) {
  return (
    <div className="border rounded-lg p-3 mb-2 bg-gray-50">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold">{idx + 1}. {p.title || "Untitled"}</span>
        {p.type && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">{p.type}</span>}
        {p.projectCategory && <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">{p.projectCategory}</span>}
      </div>
      <div className="text-sm text-gray-600 mt-1">
        {p.role && <span>Role: {p.role}</span>}
        {p.members && <span className="ml-3">Members: {p.members}</span>}
        {(p.startMonth || p.startYear) && (
          <span className="ml-3">{p.startMonth} {p.startYear}{(p.endMonth || p.endYear) ? ` – ${p.endMonth} ${p.endYear}` : ""}</span>
        )}
      </div>
      {p.techStack?.length > 0 && (
        <div className="mt-1">
          {p.techStack.map((t: string) => (
            <span key={t} className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded mr-1">{t}</span>
          ))}
        </div>
      )}
      {p.githubLink && (
        <p className="text-sm mt-1">
          <a href={p.githubLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">{p.githubLink}</a>
        </p>
      )}
      {p.description && (
        <details className="mt-1">
          <summary className="text-xs text-gray-500 cursor-pointer">Show description</summary>
          <p className="text-sm text-gray-600 mt-1 whitespace-pre-line max-h-40 overflow-y-auto">{p.description}</p>
        </details>
      )}
    </div>
  );
}

/** Card for an experience entry */
function ExperienceCard({ e, idx }: { e: Record<string, any>; idx: number }) {
  return (
    <div className="border rounded-lg p-3 mb-2 bg-gray-50">
      <span className="font-semibold">{idx + 1}. {e.company || e.organization || "Untitled"}</span>
      {e.role && <span className="text-sm text-gray-600 ml-2">— {e.role}</span>}
      {e.type && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded ml-2">{e.type}</span>}
      {e.description && <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{e.description}</p>}
    </div>
  );
}

/** Card for an award entry */
function AwardCard({ a, idx }: { a: Record<string, any>; idx: number }) {
  return (
    <div className="border rounded-lg p-3 mb-2 bg-gray-50">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold">{idx + 1}. {a.title || "Untitled"}</span>
        {a.category && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">{a.category}</span>}
      </div>
      <div className="text-sm text-gray-600 mt-1">
        {a.organization && <span>{a.organization}</span>}
        {(a.month || a.year) && <span className="ml-3">{a.month} {a.year}</span>}
      </div>
    </div>
  );
}

/** Card for a research paper / CP competition */
function GenericItemCard({ item, idx }: { item: Record<string, any>; idx: number }) {
  return (
    <div className="border rounded-lg p-3 mb-2 bg-gray-50">
      <span className="font-semibold">{idx + 1}. {item.title || item.name || item.competition || "Entry"}</span>
      {Object.entries(item)
        .filter(([k]) => !["title", "name", "competition"].includes(k))
        .map(([k, v]) => (
          <p key={k} className="text-sm text-gray-600">
            <span className="font-medium">{k}:</span> {typeof v === "string" ? v : JSON.stringify(v)}
          </p>
        ))}
    </div>
  );
}

/** Render a complex value (array or object) with proper formatting */
function FormattedValue({ fieldKey, value }: { fieldKey: string; value: any }) {
  // Empty arrays
  if (Array.isArray(value) && value.length === 0) {
    return <span className="text-gray-400 italic">None</span>;
  }

  // Skills — render as badges
  if (fieldKey === "skills" && Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((s: any, i: number) => (
          <SkillBadge key={i} skill={s.skill} proficiency={s.proficiency} />
        ))}
      </div>
    );
  }

  // Hackathons
  if (fieldKey === "hackathons" && Array.isArray(value)) {
    return <div>{value.map((h, i) => <HackathonCard key={i} h={h} idx={i} />)}</div>;
  }

  // Projects
  if (fieldKey === "projects" && Array.isArray(value)) {
    return <div>{value.map((p, i) => <ProjectCard key={i} p={p} idx={i} />)}</div>;
  }

  // Experiences
  if (fieldKey === "experiences" && Array.isArray(value)) {
    return <div>{value.map((e, i) => <ExperienceCard key={i} e={e} idx={i} />)}</div>;
  }

  // Awards
  if (fieldKey === "awards" && Array.isArray(value)) {
    return <div>{value.map((a, i) => <AwardCard key={i} a={a} idx={i} />)}</div>;
  }

  // Generic arrays of objects (researchPapers, cpCompetitions, openSource, etc.)
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
    return <div>{value.map((item, i) => <GenericItemCard key={i} item={item} idx={i} />)}</div>;
  }

  // Generic arrays of primitives
  if (Array.isArray(value)) {
    return <span>{value.join(", ")}</span>;
  }

  // Plain objects — render as key-value list
  if (typeof value === "object" && value !== null) {
    return (
      <div className="text-sm space-y-0.5">
        {Object.entries(value).map(([k, v]) => (
          <p key={k}>
            <span className="font-medium">{k}:</span>{" "}
            {typeof v === "string" ? v : JSON.stringify(v)}
          </p>
        ))}
      </div>
    );
  }

  return <span>{String(value)}</span>;
}

export default function VettingDataDisplay({
  data,
  jwtToken,
}: {
  data: Record<string, any>;
  jwtToken: string;
}) {
  const [fileMeta, setFileMeta] = useState<Record<string, FileMeta | null>>({});

  useEffect(() => {
    const fetchFileMeta = async () => {
      const meta: Record<string, FileMeta | null> = {};

      await Promise.all(
        fileFields.map(async (field) => {
          const path = data[field];
          if (typeof path === "string" && path.startsWith("applications/")) {
            try {
              const res = await fetch(
                `/api/file/metadata?path=${encodeURIComponent(path)}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${jwtToken}`,
                  },
                }
              );

              const result = await res.json();
              meta[field] = res.ok ? result.file : null;
              toast.success(`Fetched ${field} metadata successfully`);
            } catch {
              toast.error(`Failed to fetch ${field} metadata`);
              console.error(`Failed to fetch ${field} metadata`);
              meta[field] = null;
            }
          } else {
            toast.warning(`The user hasn't submitted ${field} yet.`);
            console.warn(`Invalid path for ${field}:`, path);
            meta[field] = null;
          }
        })
      );
      if (Object.keys(meta).length === 0) {
        toast.warning("No valid file paths found in the data");
      }
      setFileMeta(meta);
    };

    fetchFileMeta();
  }, [data]);

  return (
    <Table className="mt-5">
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/4">Field</TableHead>
          <TableHead>Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(data)
          .filter(([key]) => !scoringFields.includes(key))
          .map(([key, value]) => {
            // File fields with metadata
            if (fileFields.includes(key) && fileMeta[key]) {
              const meta = fileMeta[key]!;
              return (
                <TableRow key={key} className="text-base">
                  <TableCell className="font-medium align-top">{formatLabel(key)}</TableCell>
                  <TableCell>
                    <a
                      href={meta.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {meta.name} ({(meta.size / 1024 / 1024).toFixed(2)} MB)
                    </a>
                  </TableCell>
                </TableRow>
              );
            }

            // Null / empty string
            if (value === null || value === undefined || value === "") {
              return (
                <TableRow key={key}>
                  <TableCell className="font-medium align-top">{formatLabel(key)}</TableCell>
                  <TableCell className="text-gray-400 italic">—</TableCell>
                </TableRow>
              );
            }

            // String values (with URL detection)
            if (typeof value === "string") {
              return (
                <TableRow key={key}>
                  <TableCell className="font-medium align-top">{formatLabel(key)}</TableCell>
                  <TableCell><MaybeLink value={value} /></TableCell>
                </TableRow>
              );
            }

            // Booleans
            if (typeof value === "boolean") {
              return (
                <TableRow key={key}>
                  <TableCell className="font-medium align-top">{formatLabel(key)}</TableCell>
                  <TableCell>{value ? "Yes" : "No"}</TableCell>
                </TableRow>
              );
            }

            // Complex values (arrays, objects)
            return (
              <TableRow key={key}>
                <TableCell className="font-medium align-top">{formatLabel(key)}</TableCell>
                <TableCell><FormattedValue fieldKey={key} value={value} /></TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
}
