"use client"
import { OrganizationSwitcher, SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";

export function Header() {
  return (
    <div className="border-b py-4 bg-gray-50">
      <div className="container mx-auto flex justify-between items-center">
        <div>FileDrive</div>
        <div>
          <Unauthenticated>
            <SignInButton mode="modal" />
          </Unauthenticated>
          <Authenticated>
            <OrganizationSwitcher />
            <UserButton />
          </Authenticated>
        </div>
      </div>
    </div>
  );
}
