import { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileIcon,
  MoreVertical,
  StarHalf,
  StarIcon,
  TrashIcon,
  UndoIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useToast } from "@/components/ui/use-toast";
import { Protect } from "@clerk/nextjs";

export function FileCardActions({
  file,
  isFavorite,
}: {
  file: Doc<"files"> & { url: string | null };
  isFavorite: boolean;
}) {
  console.log(file)
  const { toast } = useToast();
  const deleteFile = useMutation(api.files.deleteFile);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const favoriteFile = useMutation(api.files.toggleFavorite);
  const restoreFile = useMutation(api.files.restoreFile);
  const me = useQuery(api.users.getMe)
  return (
    <>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark the file for deletion process. Files are
              deleted periodically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await deleteFile({ fileId: file._id });
                toast({
                  variant: "success",
                  title: "File marked for deletion",
                  description: "Your file will be deleted soon",
                });
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            className="flex gap-1 items-center cursor-pointer"
            onClick={() => {
              if(!file.url) return;
              window.open(file.url, "_blank");
            }}
          >
            <FileIcon className="w-4 h-4" /> Download
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex gap-1 items-center cursor-pointer"
            onClick={() => {
              favoriteFile({ fileId: file._id });
            }}
          >
            {isFavorite ? (
              <div className="flex gap-1 items-center">
                <StarIcon className="w-4 h-4" /> Unfavorite
              </div>
            ) : (
              <div className="flex gap-1 items-center">
                <StarHalf className="w-4 h-4" /> Favorite
              </div>
            )}
          </DropdownMenuItem>
          <Protect condition={(check) => {
            return check({role: "org:admin"}) || file.userId === me?._id;
          }} fallback={<></>}>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex text-red-600 gap-1 items-center cursor-pointer"
              onClick={() => {
                if (file.shouldDeleted) {
                  restoreFile({ fileId: file._id });
                } else {
                  setIsConfirmOpen(true);
                }
              }}
            >
              {file.shouldDeleted ? (
                <div className="flex text-green-600 gap-1 items-center cursor-pointer">
                  <UndoIcon /> Restore
                </div>
              ) : (
                <div className="flex text-red-600 gap-1 items-center cursor-pointer">
                  <TrashIcon className="w-4 h-4" /> Delete
                </div>
              )}
            </DropdownMenuItem>
          </Protect>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
