-- An address that sees every reminder.
--
-- Additive and nullable. NULL preserves the behaviour that shipped in
-- Slice 5: a licence with no owner produces an UNDELIVERABLE reminder that
-- revives when an owner is assigned.
ALTER TABLE "tenants" ADD COLUMN     "reminderCopyEmail" TEXT;
