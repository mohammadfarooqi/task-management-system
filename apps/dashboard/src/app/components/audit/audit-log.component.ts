import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { AuditService } from '../../services/audit.service';
import { AuditLog } from '@task-management-system/data';

@Component({
  selector: 'app-audit-log',
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss']
})
export class AuditLogComponent implements OnInit {
  currentUser: User | null = null;
  auditLogs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  isLoading = true;
  errorMessage = '';

  // Filter state
  actionFilter = '';
  resourceTypeFilter = '';
  userIdFilter = '';
  dateRangeFilter = '7'; // Last 7 days by default

  // Pagination
  currentPage = 1;
  pageSize = 50;

  // Mobile menu state
  mobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private auditService: AuditService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    // Check if user has permission to view audit logs
    if (!this.currentUser || !this.canViewAuditLogs()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadAuditLogs();
  }

  canViewAuditLogs(): boolean {
    if (!this.currentUser) return false;
    // Only SystemAdmin, Owner, and Admin can view audit logs
    return ['SystemAdmin', 'Owner', 'Admin'].includes(this.currentUser.role);
  }

  loadAuditLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const filters: any = {
      limit: this.pageSize,
      page: this.currentPage
    };

    // Add date filter
    if (this.dateRangeFilter) {
      const days = parseInt(this.dateRangeFilter);
      if (days > 0) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        filters.startDate = startDate.toISOString();
      }
    }

    // Add other filters if set
    if (this.actionFilter) {
      filters.action = this.actionFilter;
    }
    if (this.resourceTypeFilter) {
      filters.resourceType = this.resourceTypeFilter;
    }
    if (this.userIdFilter) {
      filters.userId = parseInt(this.userIdFilter);
    }

    this.auditService.getAuditLogs(filters).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.data) {
          // The API returns paginated data with nested structure
          const paginatedData = response.data as any;
          this.auditLogs = paginatedData.data || [];
          this.filteredLogs = [...this.auditLogs];
        } else {
          this.errorMessage = response.message || 'Failed to load audit logs';
        }
      },
      error: (error) => {
        console.error('Error loading audit logs:', error);
        this.isLoading = false;

        if (error.status === 403) {
          this.errorMessage = 'You do not have permission to view audit logs';
          setTimeout(() => this.router.navigate(['/dashboard']), 2000);
        } else {
          this.errorMessage = error.error?.message || 'Failed to load audit logs';
        }
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadAuditLogs();
  }

  clearFilters(): void {
    this.actionFilter = '';
    this.resourceTypeFilter = '';
    this.userIdFilter = '';
    this.dateRangeFilter = '7';
    this.currentPage = 1;
    this.loadAuditLogs();
  }

  // Get unique actions for filter dropdown
  getUniqueActions(): string[] {
    const actions = new Set(this.auditLogs.map(log => log.action));
    return Array.from(actions).sort();
  }

  // Get unique resource types for filter dropdown
  getUniqueResourceTypes(): string[] {
    const types = new Set(this.auditLogs.map(log => log.resourceType).filter(t => t));
    return Array.from(types).sort();
  }

  // Format timestamp for display
  formatTimestamp(timestamp: string | Date): string {
    return new Date(timestamp).toLocaleString();
  }

  // Get action badge color
  getActionBadgeClass(action: string): string {
    if (action.includes('created') || action.includes('register')) {
      return 'bg-green-100 text-green-800';
    } else if (action.includes('updated') || action.includes('replaced')) {
      return 'bg-blue-100 text-blue-800';
    } else if (action.includes('deleted')) {
      return 'bg-red-100 text-red-800';
    } else if (action.includes('login') || action.includes('logout')) {
      return 'bg-purple-100 text-purple-800';
    } else if (action.includes('viewed') || action.includes('accessed')) {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  }

  // Format action for display
  formatAction(action: string): string {
    return action.replace(/[_:]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Navigate back to dashboard
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  // Logout
  logout(): void {
    this.authService.logout();
  }

  // Mobile menu toggle
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}