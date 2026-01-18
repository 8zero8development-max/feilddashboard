import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { 
  Zap, 
  Plus, 
  FileText, 
  AlertCircle, 
  Calendar, 
  Users,
  Wrench,
  BarChart3
} from "lucide-react";
import { cn } from "../../../lib/utils";

const QuickActionButton = ({ icon: Icon, label, to, variant = "outline", className }) => (
  <Link to={to} className="block">
    <Button
      variant={variant}
      className={cn(
        "w-full justify-start gap-3 h-11 text-left",
        variant === "default" && "bg-primary hover:bg-primary/90",
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Button>
  </Link>
);

const QuickActionsPanel = () => {
  const primaryActions = [
    {
      icon: Plus,
      label: "New Job",
      to: "/jobs?action=new",
      variant: "default",
    },
    {
      icon: AlertCircle,
      label: "Log Issue",
      to: "/jobs?priority=urgent&action=new",
      variant: "destructive",
    },
  ];

  const secondaryActions = [
    {
      icon: FileText,
      label: "Create Quote",
      to: "/quotes?action=new",
    },
    {
      icon: Calendar,
      label: "View Schedule",
      to: "/scheduler",
    },
    {
      icon: BarChart3,
      label: "Generate Report",
      to: "/reports",
    },
    {
      icon: Users,
      label: "Manage Customers",
      to: "/customers",
    },
  ];

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg heading flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {primaryActions.map((action) => (
            <QuickActionButton
              key={action.label}
              icon={action.icon}
              label={action.label}
              to={action.to}
              variant={action.variant}
            />
          ))}
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            Navigation
          </p>
          <div className="space-y-2">
            {secondaryActions.map((action) => (
              <QuickActionButton
                key={action.label}
                icon={action.icon}
                label={action.label}
                to={action.to}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsPanel;
