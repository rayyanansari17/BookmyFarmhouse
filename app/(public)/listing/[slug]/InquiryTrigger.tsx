"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InquiryModal } from "@/components/common/InquiryModal";
import type { IProperty } from "@/types";

export function InquiryTrigger({ property }: { property: IProperty }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Send Inquiry
      </Button>
      <InquiryModal property={property} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
