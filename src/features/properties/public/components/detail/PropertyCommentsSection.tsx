"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useTransition } from "react"
import { useMutation, useQuery } from "convex/react"
import { formatDistanceToNow } from "date-fns"
import { Heart, Loader2, MessageCircle, Send, Trash2 } from "@/components/ui/icons"
import { toast } from "sonner"

import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { useUser } from "@/components/providers/UserProvider"
import { UserAvatar } from "@/components/ui/user-avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { getDisplayName } from "@/lib/user-name"

type CommentAuthor = {
    _id: string
    fullName: string | null
    email: string | null
    avatarUrl: string | null
    isPropertyOwner: boolean
} | null

type CommentReply = {
    _id: string
    content: string | null
    status: "active" | "deleted" | "hidden"
    placeholderText: string | null
    likeCount: number
    createdAt: number
    editedAt: number | null
    isLikedByViewer: boolean
    canEdit: boolean
    canDelete: boolean
    canLike: boolean
    author: CommentAuthor
}

type CommentThread = {
    _id: string
    content: string | null
    status: "active" | "deleted" | "hidden"
    placeholderText: string | null
    likeCount: number
    replyCount: number
    createdAt: number
    editedAt: number | null
    isLikedByViewer: boolean
    canEdit: boolean
    canDelete: boolean
    canLike: boolean
    canReply: boolean
    author: CommentAuthor
    replies: CommentReply[]
}

type CommentSort = "top" | "newest"

type CommentComposerProps = {
    initialValue?: string
    placeholder: string
    submitLabel: string
    onSubmit: (content: string) => Promise<void>
    onCancel?: () => void
    compact?: boolean
}

type CommentReplyItemProps = {
    reply: CommentReply
    onRequireAuth: () => void
    onLike: (commentId: string) => Promise<void>
    onUpdate: (commentId: string, content: string) => Promise<void>
    onDelete: (commentId: string) => Promise<void>
}

type CommentThreadCardProps = {
    comment: CommentThread
    onRequireAuth: () => void
    onLike: (commentId: string) => Promise<void>
    onReply: (commentId: string, content: string) => Promise<void>
    onUpdate: (commentId: string, content: string) => Promise<void>
    onDelete: (commentId: string) => Promise<void>
}

function CommentsAuthDialog({
    open,
    onOpenChange,
    redirectPath,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    redirectPath: string
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="top-auto bottom-8 left-1/2 right-auto -translate-x-1/2 translate-y-0 w-[calc(100%-32px)] max-w-[380px] gap-0 overflow-hidden rounded-[32px] border border-neutral-200/60 bg-white/95 p-0 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.2)] backdrop-blur-2xl"
            >
                <div className="p-7">
                    <div className="mb-6 flex flex-col items-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200/50 bg-neutral-100">
                            <MessageCircle className="h-6 w-6 text-neutral-900" />
                        </div>
                        <DialogTitle className="text-[22px] font-bold tracking-tight text-neutral-900">
                            Join the conversation
                        </DialogTitle>
                        <DialogDescription className="mt-2 px-2 text-[15px] font-medium leading-snug text-neutral-500">
                            Sign in or create an account to post comments, reply to other users, and like discussions on this property.
                        </DialogDescription>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link
                            href={`/sign-up?redirect=${encodeURIComponent(redirectPath)}`}
                            className="outline-none"
                            onClick={() => onOpenChange(false)}
                        >
                            <button className="flex h-[52px] w-full items-center justify-center rounded-[16px] bg-black text-[17px] font-bold tracking-tight text-white transition-all hover:bg-neutral-800 active:scale-[0.98]">
                                Create an account
                            </button>
                        </Link>
                        <Link
                            href={`/sign-in?redirect=${encodeURIComponent(redirectPath)}`}
                            className="outline-none"
                            onClick={() => onOpenChange(false)}
                        >
                            <button className="flex h-[52px] w-full items-center justify-center rounded-[16px] bg-neutral-100/80 text-[17px] font-bold tracking-tight text-neutral-900 transition-all hover:bg-neutral-200 active:scale-[0.98]">
                                Log in
                            </button>
                        </Link>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="mt-2 text-[15px] font-semibold text-neutral-400 transition-all hover:text-neutral-600 active:scale-95"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function formatCommentTimestamp(createdAt: number, editedAt: number | null) {
    const relativeTime = formatDistanceToNow(new Date(createdAt), { addSuffix: true })
    return editedAt ? `${relativeTime} · edited` : relativeTime
}

function CommentComposer({
    initialValue = "",
    placeholder,
    submitLabel,
    onSubmit,
    onCancel,
    compact = false,
}: CommentComposerProps) {
    const [content, setContent] = useState(initialValue)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = () => {
        const trimmedContent = content.trim()
        if (!trimmedContent) {
            toast.error("Write something before posting.")
            return
        }

        startTransition(async () => {
            try {
                await onSubmit(trimmedContent)
                setContent("")
                onCancel?.()
            } catch (error) {
                const message = error instanceof Error ? error.message : "Could not save your comment"
                toast.error(message)
            }
        })
    }

    return (
        <div className={cn("space-y-3", compact && "space-y-2")}>
            <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={placeholder}
                rows={compact ? 3 : 4}
                maxLength={2000}
                className={cn(
                    "resize-none rounded-[20px] border-neutral-200 bg-white text-[15px] shadow-none focus-visible:border-neutral-300 focus-visible:ring-neutral-200/80",
                    compact && "min-h-24 rounded-[18px] text-sm"
                )}
            />
            <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] font-medium text-neutral-400">
                    {content.trim().length}/2000
                </span>
                <div className="flex items-center gap-2">
                    {onCancel ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size={compact ? "sm" : "default"}
                            onClick={onCancel}
                            disabled={isPending}
                            className="rounded-full text-neutral-600 hover:bg-white"
                        >
                            Cancel
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isPending || !content.trim()}
                        size={compact ? "sm" : "default"}
                        className="rounded-full bg-neutral-900 px-5 text-white hover:bg-black"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {submitLabel}
                    </Button>
                </div>
            </div>
        </div>
    )
}

function CommentBody({
    author,
    createdAt,
    editedAt,
    content,
    placeholderText,
    isRemoved,
}: {
    author: CommentAuthor
    createdAt: number
    editedAt: number | null
    content: string | null
    placeholderText: string | null
    isRemoved: boolean
}) {
    return (
        <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[14px] font-semibold text-neutral-900">
                    {getDisplayName(author, "User")}
                </span>
                {author?.isPropertyOwner ? (
                    <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                        Host
                    </span>
                ) : null}
                <span className="text-[12px] font-medium text-neutral-400">
                    {formatCommentTimestamp(createdAt, editedAt)}
                </span>
            </div>
            {isRemoved ? (
                <p className="mt-2 text-[14px] font-medium italic text-neutral-400">
                    {placeholderText}
                </p>
            ) : (
                <p className="mt-2 whitespace-pre-line break-words text-[15px] font-medium leading-[1.65] text-neutral-700">
                    {content}
                </p>
            )}
        </div>
    )
}

function CommentActionRow({
    isLiked,
    likeCount,
    canLike,
    canReply,
    showReply,
    showEdit,
    onRequireAuth,
    onLike,
    onReplyToggle,
    onEditToggle,
    onDelete,
}: {
    isLiked: boolean
    likeCount: number
    canLike: boolean
    canReply?: boolean
    showReply?: boolean
    showEdit?: boolean
    onRequireAuth: () => void
    onLike: () => Promise<void>
    onReplyToggle?: () => void
    onEditToggle?: () => void
    onDelete?: () => Promise<void>
}) {
    const [isLiking, startLikeTransition] = useTransition()

    const handleLike = () => {
        if (!canLike) {
            onRequireAuth()
            return
        }

        startLikeTransition(async () => {
            try {
                await onLike()
            } catch (error) {
                const message = error instanceof Error ? error.message : "Could not update like"
                toast.error(message)
            }
        })
    }

    return (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={isLiking}
                className={cn(
                    "h-8 rounded-full px-3 text-[13px] font-semibold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
                    isLiked && "text-rose-600 hover:text-rose-700"
                )}
            >
                {isLiking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />}
                {likeCount}
            </Button>
            {canReply !== undefined && onReplyToggle ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        if (!canReply) {
                            onRequireAuth()
                            return
                        }
                        onReplyToggle()
                    }}
                    className={cn(
                        "h-8 rounded-full px-3 text-[13px] font-semibold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
                        showReply && "bg-neutral-100 text-neutral-900"
                    )}
                >
                    Reply
                </Button>
            ) : null}
            {onEditToggle ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onEditToggle}
                    className={cn(
                        "h-8 rounded-full px-3 text-[13px] font-semibold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
                        showEdit && "bg-neutral-100 text-neutral-900"
                    )}
                >
                    Edit
                </Button>
            ) : null}
            {onDelete ? (
                <ConfirmDialog
                    trigger={
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-full px-3 text-[13px] font-semibold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    }
                    title="Delete comment"
                    description="This will remove your comment from the public thread."
                    confirmText="Delete comment"
                    variant="destructive"
                    onConfirm={onDelete}
                />
            ) : null}
        </div>
    )
}

function CommentReplyItem({
    reply,
    onRequireAuth,
    onLike,
    onUpdate,
    onDelete,
}: CommentReplyItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const isRemoved = reply.status !== "active"

    return (
        <div className="flex gap-3">
            <UserAvatar
                user={{
                    _id: reply.author?._id,
                    fullName: reply.author?.fullName,
                    email: reply.author?.email,
                    avatarUrl: reply.author?.avatarUrl,
                }}
                className="mt-0.5 h-9 w-9 shrink-0"
            />
            <div className="min-w-0 flex-1">
                {isEditing ? (
                    <CommentComposer
                        initialValue={reply.content ?? ""}
                        placeholder="Update your reply"
                        submitLabel="Save"
                        compact
                        onSubmit={async (content) => {
                            await onUpdate(reply._id, content)
                            setIsEditing(false)
                        }}
                        onCancel={() => setIsEditing(false)}
                    />
                ) : (
                    <>
                        <CommentBody
                            author={reply.author}
                            createdAt={reply.createdAt}
                            editedAt={reply.editedAt}
                            content={reply.content}
                            placeholderText={reply.placeholderText}
                            isRemoved={isRemoved}
                        />
                        {!isRemoved ? (
                            <CommentActionRow
                                isLiked={reply.isLikedByViewer}
                                likeCount={reply.likeCount}
                                canLike={reply.canLike}
                                showEdit={isEditing}
                                onRequireAuth={onRequireAuth}
                                onLike={() => onLike(reply._id)}
                                onEditToggle={reply.canEdit ? () => setIsEditing((current) => !current) : undefined}
                                onDelete={reply.canDelete ? () => onDelete(reply._id) : undefined}
                            />
                        ) : null}
                    </>
                )}
            </div>
        </div>
    )
}

function CommentThreadCard({
    comment,
    onRequireAuth,
    onLike,
    onReply,
    onUpdate,
    onDelete,
}: CommentThreadCardProps) {
    const [isReplying, setIsReplying] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    const isRemoved = comment.status !== "active"

    return (
        <article className="px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
            <div className="flex gap-3.5">
                <UserAvatar
                    user={{
                        _id: comment.author?._id,
                        fullName: comment.author?.fullName,
                        email: comment.author?.email,
                        avatarUrl: comment.author?.avatarUrl,
                    }}
                    className="mt-0.5 h-10 w-10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                    {isEditing ? (
                        <CommentComposer
                            initialValue={comment.content ?? ""}
                            placeholder="Update your comment"
                            submitLabel="Save"
                            onSubmit={async (content) => {
                                await onUpdate(comment._id, content)
                                setIsEditing(false)
                            }}
                            onCancel={() => setIsEditing(false)}
                        />
                    ) : (
                        <>
                            <CommentBody
                                author={comment.author}
                                createdAt={comment.createdAt}
                                editedAt={comment.editedAt}
                                content={comment.content}
                                placeholderText={comment.placeholderText}
                                isRemoved={isRemoved}
                            />
                            {!isRemoved ? (
                                <CommentActionRow
                                    isLiked={comment.isLikedByViewer}
                                    likeCount={comment.likeCount}
                                    canLike={comment.canLike}
                                    canReply={comment.canReply}
                                    showReply={isReplying}
                                    showEdit={isEditing}
                                    onRequireAuth={onRequireAuth}
                                    onLike={() => onLike(comment._id)}
                                    onReplyToggle={() => setIsReplying((current) => !current)}
                                    onEditToggle={comment.canEdit ? () => setIsEditing((current) => !current) : undefined}
                                    onDelete={comment.canDelete ? () => onDelete(comment._id) : undefined}
                                />
                            ) : null}
                        </>
                    )}

                    {isReplying ? (
                        <div className="mt-4 rounded-[22px] border border-neutral-200 bg-neutral-50 p-4">
                            <CommentComposer
                                placeholder="Reply to this comment"
                                submitLabel="Reply"
                                compact
                                onSubmit={async (content) => {
                                    await onReply(comment._id, content)
                                    setIsReplying(false)
                                }}
                                onCancel={() => setIsReplying(false)}
                            />
                        </div>
                    ) : null}

                    {comment.replies.length > 0 ? (
                        <div className="mt-5 rounded-[22px] border border-neutral-100 bg-neutral-50 p-4 sm:p-5">
                            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                                Replies
                            </div>
                            <div className="space-y-4">
                            {comment.replies.map((reply) => (
                                <CommentReplyItem
                                    key={reply._id}
                                    reply={reply}
                                    onRequireAuth={onRequireAuth}
                                    onLike={onLike}
                                    onUpdate={onUpdate}
                                    onDelete={onDelete}
                                />
                            ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </article>
    )
}

function CommentsSkeleton() {
    return (
        <div className="overflow-hidden rounded-[24px] border border-neutral-100 bg-white lg:max-w-[680px]">
            {Array.from({ length: 2 }).map((_, index) => (
                <div
                    key={index}
                    className={cn("px-4 py-5 sm:px-5 lg:px-6 lg:py-6", index > 0 && "border-t border-neutral-100")}
                >
                    <div className="flex gap-3.5">
                        <Skeleton variant="circular" className="h-10 w-10 shrink-0" />
                        <div className="min-w-0 flex-1 space-y-3">
                            <Skeleton className="h-4 w-40 rounded-full" />
                            <Skeleton className="h-4 w-full rounded-full" />
                            <Skeleton className="h-4 w-4/5 rounded-full" />
                            <div className="flex gap-2 pt-1">
                                <Skeleton className="h-8 w-16 rounded-full" />
                                <Skeleton className="h-8 w-16 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export function PropertyCommentsSection({
    propertyId,
    initialCommentCount = 0,
}: {
    propertyId: string
    initialCommentCount?: number
}) {
    const { user } = useUser()
    const pathname = usePathname()
    const [sort, setSort] = useState<CommentSort>("top")
    const [authDialogOpen, setAuthDialogOpen] = useState(false)

    const commentThread = useQuery(api.propertyComments.listForProperty, {
        propertyId: propertyId as Id<"properties">,
        sort,
    })

    const createComment = useMutation(api.propertyComments.createComment)
    const replyToComment = useMutation(api.propertyComments.replyToComment)
    const updateOwnComment = useMutation(api.propertyComments.updateOwnComment)
    const deleteOwnComment = useMutation(api.propertyComments.deleteOwnComment)
    const toggleLike = useMutation(api.propertyComments.toggleLike)

    const comments = commentThread?.comments ?? []
    const commentCount = commentThread?.summary.commentCount ?? initialCommentCount

    const requireAuth = () => setAuthDialogOpen(true)

    const handleCreateComment = async (content: string) => {
        if (!user) {
            requireAuth()
            return
        }

        await createComment({
            propertyId: propertyId as Id<"properties">,
            content,
        })
        toast.success("Comment posted")
    }

    const handleReply = async (parentCommentId: string, content: string) => {
        if (!user) {
            requireAuth()
            return
        }

        await replyToComment({
            propertyId: propertyId as Id<"properties">,
            parentCommentId: parentCommentId as Id<"propertyComments">,
            content,
        })
        toast.success("Reply posted")
    }

    const handleUpdate = async (commentId: string, content: string) => {
        await updateOwnComment({
            commentId: commentId as Id<"propertyComments">,
            content,
        })
        toast.success("Comment updated")
    }

    const handleDelete = async (commentId: string) => {
        await deleteOwnComment({
            commentId: commentId as Id<"propertyComments">,
        })
        toast.success("Comment removed")
    }

    const handleLike = async (commentId: string) => {
        if (!user) {
            requireAuth()
            return
        }

        await toggleLike({
            commentId: commentId as Id<"propertyComments">,
        })
    }

    return (
        <section className="mb-6 pt-1 lg:mb-7 lg:border-b lg:border-neutral-100 lg:pb-7 lg:pt-0">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400 lg:mb-3">
                        Public Discussion
                    </p>
                    <h2 className="text-[18px] font-[800] tracking-[-0.02em] text-neutral-900 lg:text-[22px] lg:font-[900]">
                        Comments
                    </h2>
                    <p className="mt-1 max-w-[520px] text-[14px] font-medium text-neutral-500">
                        {commentCount} public {commentCount === 1 ? "comment" : "comments"} on this property. Ask questions, leave context, or see what other renters noticed.
                    </p>
                </div>
                <div className="inline-flex w-fit items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 p-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSort("top")}
                        className={cn(
                            "rounded-full px-4 text-neutral-500 hover:text-neutral-900",
                            sort === "top" && "bg-neutral-900 text-white hover:bg-black hover:text-white"
                        )}
                    >
                        Top
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSort("newest")}
                        className={cn(
                            "rounded-full px-4 text-neutral-500 hover:text-neutral-900",
                            sort === "newest" && "bg-neutral-900 text-white hover:bg-black hover:text-white"
                        )}
                    >
                        Newest
                    </Button>
                </div>
            </div>

            <div className="mb-5 rounded-[24px] border border-neutral-100 bg-neutral-50 p-4 sm:p-5 lg:max-w-[680px]">
                {user ? (
                    <div className="flex gap-3.5">
                        <UserAvatar
                            user={{
                                _id: user._id,
                                fullName: user.fullName,
                                email: user.email,
                                avatarUrl: user.avatarUrl,
                            }}
                            className="mt-1 h-10 w-10 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="mb-1 text-[15px] font-[800] text-neutral-900">
                                Start the conversation
                            </p>
                            <p className="mb-3 text-[13px] font-medium text-neutral-500">
                                Commenting as {getDisplayName(user, "User")}
                            </p>
                            <CommentComposer
                                placeholder="Share your thoughts about this property"
                                submitLabel="Comment"
                                onSubmit={handleCreateComment}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-[16px] font-[800] text-neutral-900">
                                Jump into the thread
                            </p>
                            <p className="mt-1 text-[14px] font-medium text-neutral-500">
                                Log in to post comments, reply to people, and like helpful feedback.
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={requireAuth}
                            className="rounded-full bg-neutral-900 px-5 text-white hover:bg-black"
                        >
                            Join the conversation
                        </Button>
                    </div>
                )}
            </div>

            {commentThread === undefined ? (
                <CommentsSkeleton />
            ) : comments.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center lg:max-w-[680px]">
                    <p className="text-[18px] font-[800] text-neutral-900">No comments yet</p>
                    <p className="mt-2 text-[14px] font-medium text-neutral-500">
                        Be the first to start the discussion for this property.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-[24px] border border-neutral-100 bg-white lg:max-w-[680px]">
                    {comments.map((comment) => (
                        <div key={comment._id} className="border-t border-neutral-100 first:border-t-0">
                            <CommentThreadCard
                                comment={comment}
                                onRequireAuth={requireAuth}
                                onLike={handleLike}
                                onReply={handleReply}
                                onUpdate={handleUpdate}
                                onDelete={handleDelete}
                            />
                        </div>
                    ))}
                </div>
            )}

            <CommentsAuthDialog
                open={authDialogOpen}
                onOpenChange={setAuthDialogOpen}
                redirectPath={pathname}
            />
        </section>
    )
}
