import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface EmployeeBannerProps {
  name: string;
  role: string;
  phone: string;
  email: string;
  department: string;
}

export function EmployeeBanner({ name, role, phone, email, department }: EmployeeBannerProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const departmentIcons: Record<string, string> = {
    'Road Tech': 'fa-wrench',
    'Sales': 'fa-dollar-sign',
    'Parts': 'fa-box',
    'Accounting': 'fa-calculator',
    'Management': 'fa-user-tie',
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-card border-l-4 border-l-primary rounded-lg" data-testid="banner-employee">
      <Avatar className="h-12 w-12">
        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground truncate" data-testid="text-employee-name">{name}</h3>
          <Badge variant="secondary" className="text-xs">
            <i className={`fas ${departmentIcons[department] || 'fa-user'} mr-1`}></i>
            {role}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
          <span className="flex items-center gap-1" data-testid="text-employee-phone">
            <i className="fas fa-phone text-xs"></i>
            {phone}
          </span>
          <span className="flex items-center gap-1 truncate" data-testid="text-employee-email">
            <i className="fas fa-envelope text-xs"></i>
            {email}
          </span>
        </div>
      </div>
    </div>
  );
}
