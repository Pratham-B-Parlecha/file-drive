"use client";

import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

import { UploadButton } from "./upload-button";
import { FileCard } from "./file-card";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { SearchBar } from "./search-bar";
import { useState } from "react";

function PlaceHolder() {
  return (
    <div className="flex flex-col gap-8 w-full items-center mt-12">
      <Image src="/empty.svg" alt="" width={300} height={300} />
      <div className="text-2xl">You have no files, upload one now</div>
      <UploadButton />
    </div>
  );
}

export function FileBrowser({
  title,
  favorite,
}: {
  title: string;
  favorite?: boolean;
}) {
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { user, isLoaded: userLoaded } = useUser();
  const [query, setQuery] = useState("");

  let orgId: string | undefined = undefined;

  if (userLoaded && orgLoaded) {
    orgId = organization?.id ?? user?.id;
  }

  const favorites =  useQuery(api.files.getAllFavorite, orgId ? { orgId } : "skip");

  const files = useQuery(
    api.files.getFiles,
    orgId ? { orgId, query, favorite } : "skip"
  );

  const isLoading = files === undefined;
  return (
    <div>
      {isLoading && (
        <div className="flex flex-col gap-8 w-full items-center mt-12">
          <Loader2 className="h-32 w-32 animate-spin text-gray-500" />
          <div className="text-2xl">Loading your files...</div>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">{title}</h1>
            <SearchBar query={query} setQuery={setQuery} />
            <UploadButton />
          </div>
          {files.length === 0 && <PlaceHolder />}
          <div className="grid grid-cols-3 gap-4">
            {files?.map((file) => {
              return <FileCard favorites={favorites ?? []} key={file._id} file={file} />;
            })}
          </div>
        </>
      )}
    </div>
  );
}
