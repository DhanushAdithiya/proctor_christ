import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Subject } from "@/app/actions/createSubject";

export default function SubjectHeader({ subject }: { subject: Subject }): JSX.Element {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(subject.classCode));
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: `Subject code ${subject.classCode} copied to clipboard.`,
        duration: 2000, // Show toast for 2 seconds
      });
      setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Error",
        description: "Failed to copy subject code.",
        variant: "destructive",
        duration: 2000,
      });
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-3xl font-bold text-gray-900">
        {subject.subjectCode} - {subject.name} - {subject.batch}
      </h1>
      <div className="flex items-center text-sm text-gray-500 gap-2">
        <span>
          Subject Code:{" "}
          <span className="font-medium text-gray-700">{subject.classCode}</span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="h-5 w-5"
        >
          {isCopied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span className="sr-only">Copy Subject Code</span>
        </Button>
      </div>
    </div>
  );
}
