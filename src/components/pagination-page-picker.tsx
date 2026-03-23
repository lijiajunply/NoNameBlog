"use client";

import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PaginationPagePickerProps = {
  currentPage: number;
  totalPages: number;
  onSelectPage: (page: number) => void;
};

export function PaginationPagePicker({
  currentPage,
  totalPages,
  onSelectPage,
}: PaginationPagePickerProps) {
  if (totalPages <= 1) {
    return (
      <span className="text-sm text-neutral-500 dark:text-neutral-400">
        第 1 / 1 页
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-9 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          第 {currentPage} / {totalPages} 页
          <Icon icon="ph:caret-down-bold" className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="max-h-72 min-w-[12rem] overflow-y-auto"
      >
        <DropdownMenuRadioGroup
          value={String(currentPage)}
          onValueChange={(value) => onSelectPage(Number(value))}
        >
          {Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;

            return (
              <DropdownMenuRadioItem key={page} value={String(page)}>
                第 {page} 页
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
