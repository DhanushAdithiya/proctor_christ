import { cn } from "@/lib/utils";
import { Button as ShadcnButton, ButtonProps } from "@/components/ui/button";

interface Props extends ButtonProps {}

const Button = ({ className, variant, ...props }: Props) => {
  return (
    <ShadcnButton
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        variant === "outline" && "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        variant === "link" && "text-primary underline-offset-4 hover:underline",
        variant === "green" && "bg-green-500 text-white hover:bg-green-600", // Your custom green variant
        className
      )}
      {...props}
    />
  );
};

export { Button };