import React, { useState } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { cn } from "../../lib/utils";
import { FormFieldProp } from "../../lib/schemas/formSchema";

const PAPER_RANKS = ["A*", "A", "B*", "B", "C", "Unranked"] as const;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 25 }, (_, i) => String(CURRENT_YEAR - i));

type PaperRank = (typeof PAPER_RANKS)[number];

interface ResearchPaperFormData {
  title: string;
  venue: string;
  rank: PaperRank | "";
  year: string;
  verificationLink: string;
}

interface CompetitionFormData {
  name: string;
  achievement: string;
  year: string;
  verificationLink: string;
}

const EMPTY_PAPER: ResearchPaperFormData = {
  title: "",
  venue: "",
  rank: "",
  year: "",
  verificationLink: "",
};

const EMPTY_COMPETITION: CompetitionFormData = {
  name: "",
  achievement: "",
  year: "",
  verificationLink: "",
};

export function ResearchCompetitiveInput({ form }: { form: FormFieldProp }) {
  const papers = (form.watch("researchPapers") || []) as ResearchPaperFormData[];
  const competitions = (form.watch("cpCompetitions") || []) as CompetitionFormData[];
  const hasPublishedResearch = form.watch("hasPublishedResearch");
  const hasQualifiedCpCompetitions = form.watch("hasQualifiedCpCompetitions");

  const [isPaperDialogOpen, setIsPaperDialogOpen] = useState(false);
  const [paperEditingIndex, setPaperEditingIndex] = useState<number | null>(null);
  const [paperErrors, setPaperErrors] = useState<Record<string, string>>({});
  const [paperForm, setPaperForm] = useState<ResearchPaperFormData>({ ...EMPTY_PAPER });

  const [isCompetitionDialogOpen, setIsCompetitionDialogOpen] = useState(false);
  const [competitionEditingIndex, setCompetitionEditingIndex] = useState<number | null>(null);
  const [competitionErrors, setCompetitionErrors] = useState<Record<string, string>>({});
  const [competitionForm, setCompetitionForm] = useState<CompetitionFormData>({ ...EMPTY_COMPETITION });

  const openPaperDialog = (index: number | null = null) => {
    if (index !== null) {
      setPaperForm(papers[index]);
      setPaperEditingIndex(index);
    } else {
      setPaperForm({ ...EMPTY_PAPER });
      setPaperEditingIndex(null);
    }
    setPaperErrors({});
    setIsPaperDialogOpen(true);
  };

  const openCompetitionDialog = (index: number | null = null) => {
    if (index !== null) {
      setCompetitionForm(competitions[index]);
      setCompetitionEditingIndex(index);
    } else {
      setCompetitionForm({ ...EMPTY_COMPETITION });
      setCompetitionEditingIndex(null);
    }
    setCompetitionErrors({});
    setIsCompetitionDialogOpen(true);
  };

  const savePaper = () => {
    const errors: Record<string, string> = {};

    if (!paperForm.title.trim()) errors.title = "Paper title is required";
    if (!paperForm.venue.trim()) errors.venue = "Journal / conference name is required";
    if (!paperForm.rank) errors.rank = "Please select rank";
    if (!paperForm.year) errors.year = "Publication year is required";
    if (!paperForm.verificationLink.trim()) {
      errors.verificationLink = "Verification link is required";
    } else {
      try {
        new URL(paperForm.verificationLink);
      } catch {
        errors.verificationLink = "Enter a valid URL";
      }
    }

    if (Object.keys(errors).length > 0) {
      setPaperErrors(errors);
      return;
    }

    const current = (form.getValues("researchPapers") || []) as ResearchPaperFormData[];
    if (paperEditingIndex !== null) {
      const updated = [...current];
      updated[paperEditingIndex] = paperForm;
      form.setValue("researchPapers", updated as any, { shouldDirty: true });
    } else {
      if (current.length >= 3) return;
      form.setValue("researchPapers", [...current, paperForm] as any, { shouldDirty: true });
    }

    form.trigger("researchPapers");
    setIsPaperDialogOpen(false);
    setPaperForm({ ...EMPTY_PAPER });
    setPaperEditingIndex(null);
  };

  const saveCompetition = () => {
    const errors: Record<string, string> = {};

    if (!competitionForm.name.trim()) errors.name = "Competition name is required";
    if (!competitionForm.achievement.trim()) errors.achievement = "Qualification / achievement is required";
    if (!competitionForm.year) errors.year = "Year is required";
    if (competitionForm.verificationLink.trim()) {
      try {
        new URL(competitionForm.verificationLink);
      } catch {
        errors.verificationLink = "Enter a valid URL";
      }
    }

    if (Object.keys(errors).length > 0) {
      setCompetitionErrors(errors);
      return;
    }

    const current = (form.getValues("cpCompetitions") || []) as CompetitionFormData[];
    if (competitionEditingIndex !== null) {
      const updated = [...current];
      updated[competitionEditingIndex] = competitionForm;
      form.setValue("cpCompetitions", updated as any, { shouldDirty: true });
    } else {
      if (current.length >= 5) return;
      form.setValue("cpCompetitions", [...current, competitionForm] as any, { shouldDirty: true });
    }

    form.trigger("cpCompetitions");
    setIsCompetitionDialogOpen(false);
    setCompetitionForm({ ...EMPTY_COMPETITION });
    setCompetitionEditingIndex(null);
  };

  const deletePaper = (index: number) => {
    const current = (form.getValues("researchPapers") || []) as ResearchPaperFormData[];
    form.setValue(
      "researchPapers",
      current.filter((_, i) => i !== index) as any,
      { shouldDirty: true }
    );
    form.trigger("researchPapers");
  };

  const deleteCompetition = (index: number) => {
    const current = (form.getValues("cpCompetitions") || []) as CompetitionFormData[];
    form.setValue(
      "cpCompetitions",
      current.filter((_, i) => i !== index) as any,
      { shouldDirty: true }
    );
    form.trigger("cpCompetitions");
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="hasPublishedResearch"
          render={({ field }) => (
            <FormItem className="w-full max-w-2xl font-ovo">
              <FormLabel className="text-lg font-semibold text-gray-900">
                Research Publications
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value === "No") {
                      form.setValue("researchPapers", [] as any, { shouldDirty: true });
                      form.trigger("researchPapers");
                    }
                  }}
                >
                  <SelectTrigger className="w-full md:w-1/2">
                    <SelectValue placeholder="Have you published any paper?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {hasPublishedResearch === "Yes" && (
          <FormField
            control={form.control}
            name="researchPapers"
            render={({ fieldState }) => (
              <FormItem className="w-full max-w-2xl font-ovo">
                <div className="flex justify-between items-center mb-4">
                  <FormLabel className="text-base font-semibold text-gray-900">
                    Published Papers <span className="text-xs font-medium" style={{ color: "#4d9a9a" }}>Add max 3 papers</span>
                  </FormLabel>

                  <Dialog open={isPaperDialogOpen} onOpenChange={setIsPaperDialogOpen}>
                    {papers.length < 3 && (
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          onClick={() => openPaperDialog()}
                          className="flex items-center gap-2 bg-accentBlue hover:bg-accentBlue/90 text-white"
                        >
                          <Plus className="w-4 h-4" />
                          Add Paper ({papers.length}/3)
                        </Button>
                      </DialogTrigger>
                    )}
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{paperEditingIndex !== null ? "Edit Paper" : "Add Published Paper"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">Paper Title</label>
                          <Input
                            value={paperForm.title}
                            onChange={(e) => setPaperForm((p) => ({ ...p, title: e.target.value }))}
                            className={cn("w-full", paperErrors.title && "border-red-500")}
                            placeholder="e.g., Efficient LLM Distillation for Edge Devices"
                          />
                          {paperErrors.title && <p className="text-sm text-red-500 mt-1">{paperErrors.title}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Journal / Conference</label>
                            <Input
                              value={paperForm.venue}
                              onChange={(e) => setPaperForm((p) => ({ ...p, venue: e.target.value }))}
                              className={cn("w-full", paperErrors.venue && "border-red-500")}
                              placeholder="e.g., IEEE ICMLA"
                            />
                            {paperErrors.venue && <p className="text-sm text-red-500 mt-1">{paperErrors.venue}</p>}
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Rank</label>
                            <Select
                              value={paperForm.rank}
                              onValueChange={(value) => setPaperForm((p) => ({ ...p, rank: value as PaperRank }))}
                            >
                              <SelectTrigger className={cn("w-full", paperErrors.rank && "border-red-500")}>
                                <SelectValue placeholder="Select rank" />
                              </SelectTrigger>
                              <SelectContent>
                                {PAPER_RANKS.map((rank) => (
                                  <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {paperErrors.rank && <p className="text-sm text-red-500 mt-1">{paperErrors.rank}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Year</label>
                            <Select
                              value={paperForm.year}
                              onValueChange={(value) => setPaperForm((p) => ({ ...p, year: value }))}
                            >
                              <SelectTrigger className={cn("w-full", paperErrors.year && "border-red-500")}>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                {YEARS.map((year) => (
                                  <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {paperErrors.year && <p className="text-sm text-red-500 mt-1">{paperErrors.year}</p>}
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Verification Link</label>
                            <Input
                              value={paperForm.verificationLink}
                              onChange={(e) => setPaperForm((p) => ({ ...p, verificationLink: e.target.value }))}
                              className={cn("w-full", paperErrors.verificationLink && "border-red-500")}
                              placeholder="https://doi.org/... or conference page link"
                            />
                            {paperErrors.verificationLink && (
                              <p className="text-sm text-red-500 mt-1">{paperErrors.verificationLink}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsPaperDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={savePaper}>
                          {paperEditingIndex !== null ? "Update Paper" : "Add Paper"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <FormControl>
                  <div className="space-y-3">
                    {papers.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-6">
                        No papers added yet. Click &quot;Add Paper&quot; to get started.
                      </p>
                    ) : (
                      papers.map((paper, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{paper.title}</h3>
                              <p className="text-sm text-gray-700 truncate">{paper.venue}</p>
                              <p className="text-xs text-gray-600 mt-1">Rank: {paper.rank} | Year: {paper.year}</p>
                              <a
                                href={paper.verificationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-accentBlue hover:underline mt-1 inline-block"
                              >
                                Verification
                              </a>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button type="button" variant="ghost" size="sm" onClick={() => openPaperDialog(index)} className="p-2 h-8 w-8">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => deletePaper(index)} className="p-2 h-8 w-8">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </FormControl>
                {fieldState.error?.message ? (
                  <p className="text-sm text-red-500 mt-2">{fieldState.error.message}</p>
                ) : (
                  <FormMessage />
                )}
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="space-y-4">
        <FormItem className="w-full max-w-2xl font-ovo">
          <FormLabel className="text-lg font-semibold text-gray-900">
            Competitive Programming
          </FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="codeforcesRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Codeforces Rating</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="e.g., 1620"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="codeforcesUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Codeforces User ID</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="e.g., tourist"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="codechefRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">CodeChef Rating</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="e.g., 1820"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="codechefUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">CodeChef User ID</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="e.g., your_handle"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormItem>

        <FormField
          control={form.control}
          name="hasQualifiedCpCompetitions"
          render={({ field }) => (
            <FormItem className="w-full max-w-2xl font-ovo">
              <FormLabel className="text-base font-semibold text-gray-900">
                Qualified Competitions (ICPC, etc.)
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value === "No") {
                      form.setValue("cpCompetitions", [] as any, { shouldDirty: true });
                      form.trigger("cpCompetitions");
                    }
                  }}
                >
                  <SelectTrigger className="w-full md:w-1/2">
                    <SelectValue placeholder="Have you qualified any major CP competitions?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {hasQualifiedCpCompetitions === "Yes" && (
          <FormField
            control={form.control}
            name="cpCompetitions"
            render={({ fieldState }) => (
              <FormItem className="w-full max-w-2xl font-ovo">
                <div className="flex justify-between items-center mb-4">
                  <FormLabel className="text-base font-semibold text-gray-900">
                    Competition Achievements <span className="text-xs font-medium" style={{ color: "#4d9a9a" }}>Add max 5</span>
                  </FormLabel>

                  <Dialog open={isCompetitionDialogOpen} onOpenChange={setIsCompetitionDialogOpen}>
                    {competitions.length < 5 && (
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          onClick={() => openCompetitionDialog()}
                          className="flex items-center gap-2 bg-accentBlue hover:bg-accentBlue/90 text-white"
                        >
                          <Plus className="w-4 h-4" />
                          Add Competition ({competitions.length}/5)
                        </Button>
                      </DialogTrigger>
                    )}
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{competitionEditingIndex !== null ? "Edit Competition" : "Add Competition"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">Competition Name</label>
                          <Input
                            value={competitionForm.name}
                            onChange={(e) => setCompetitionForm((p) => ({ ...p, name: e.target.value }))}
                            className={cn("w-full", competitionErrors.name && "border-red-500")}
                            placeholder="e.g., ICPC Regional"
                          />
                          {competitionErrors.name && <p className="text-sm text-red-500 mt-1">{competitionErrors.name}</p>}
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-1 block">Qualification / Achievement</label>
                          <Input
                            value={competitionForm.achievement}
                            onChange={(e) => setCompetitionForm((p) => ({ ...p, achievement: e.target.value }))}
                            className={cn("w-full", competitionErrors.achievement && "border-red-500")}
                            placeholder="e.g., Regional finalist / Qualified for regionals"
                          />
                          {competitionErrors.achievement && (
                            <p className="text-sm text-red-500 mt-1">{competitionErrors.achievement}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Year</label>
                            <Select
                              value={competitionForm.year}
                              onValueChange={(value) => setCompetitionForm((p) => ({ ...p, year: value }))}
                            >
                              <SelectTrigger className={cn("w-full", competitionErrors.year && "border-red-500")}>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                {YEARS.map((year) => (
                                  <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {competitionErrors.year && <p className="text-sm text-red-500 mt-1">{competitionErrors.year}</p>}
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Verification Link (Optional)</label>
                            <Input
                              value={competitionForm.verificationLink}
                              onChange={(e) => setCompetitionForm((p) => ({ ...p, verificationLink: e.target.value }))}
                              className={cn("w-full", competitionErrors.verificationLink && "border-red-500")}
                              placeholder="https://icpc.global/... (optional)"
                            />
                            {competitionErrors.verificationLink && (
                              <p className="text-sm text-red-500 mt-1">{competitionErrors.verificationLink}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsCompetitionDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={saveCompetition}>
                          {competitionEditingIndex !== null ? "Update Competition" : "Add Competition"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <FormControl>
                  <div className="space-y-3">
                    {competitions.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-6">
                        No competitions added yet. Click &quot;Add Competition&quot; to get started.
                      </p>
                    ) : (
                      competitions.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                              <p className="text-sm text-gray-700 truncate">{item.achievement}</p>
                              <p className="text-xs text-gray-600 mt-1">Year: {item.year}</p>
                              {item.verificationLink && (
                                <a
                                  href={item.verificationLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-accentBlue hover:underline mt-1 inline-block"
                                >
                                  Verification
                                </a>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button type="button" variant="ghost" size="sm" onClick={() => openCompetitionDialog(index)} className="p-2 h-8 w-8">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => deleteCompetition(index)} className="p-2 h-8 w-8">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </FormControl>
                {fieldState.error?.message ? (
                  <p className="text-sm text-red-500 mt-2">{fieldState.error.message}</p>
                ) : (
                  <FormMessage />
                )}
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
}
