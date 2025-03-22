"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SignInButton } from "@clerk/nextjs"
import { useEffect, useState } from "react"

interface AuthDialogProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description: string
    actionType: "like" | "save" | "upload"
    onComplete?: () => void
}

export function AuthDialog({ isOpen, onClose, title, description, actionType, onComplete }: AuthDialogProps) {
    const [redirectUrl, setRedirectUrl] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setRedirectUrl(window.location.href);
        }
    }, []);
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <SignInButton mode="modal" forceRedirectUrl={redirectUrl} signUpForceRedirectUrl={redirectUrl}>
                        <Button onClick={onComplete}>Sign In</Button>
                    </SignInButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

