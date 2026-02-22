export interface ErrorReportInput {
  message: string;
  code?: string;
  status?: number;
  traceId?: string;
  timestamp?: string;
  details?: string;
  referenceId?: string;
}

export interface ErrorReportContext extends ErrorReportInput {
  referenceId: string;
  url: string;
  userAgent: string;
  timestamp: string;
}
