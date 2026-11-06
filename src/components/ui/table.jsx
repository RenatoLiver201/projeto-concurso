/**
 * Primitivas de tabela: DataTable, Thead, Tr, Td.
 */
import { cn } from "../../lib/cn";

export const DataTable = ({ children, className }) => (
  <div className={cn("overflow-x-auto rounded-lg border border-line", className)}>
    <table className="w-full min-w-[560px] border-collapse text-[13px]">{children}</table>
  </div>
);

export const Tr = ({ children, className, ...t }) => (
  <tr {...t} className={cn("border-t border-line first:border-t-0", className)}>
    {children}
  </tr>
);

export const Td = ({ children, className, ...t }) => (
  <td {...t} className={cn("px-3 py-2 align-top", className)}>
    {children}
  </td>
);

export const Thead = ({ children }) => (
  <thead className="bg-surface2">
    <tr>{children}</tr>
  </thead>
);
