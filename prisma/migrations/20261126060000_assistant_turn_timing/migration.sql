-- Per-turn server timing is separate from model-call usage and contains no conversation data.
CREATE TABLE "AssistantTurnTiming" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL,
  "serverDurationMs" INTEGER NOT NULL CHECK ("serverDurationMs" BETWEEN 0 AND 3600000),
  CONSTRAINT "AssistantTurnTiming_time_order" CHECK ("completedAt" >= "startedAt"),
  CONSTRAINT "AssistantTurnTiming_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AssistantTurnTiming_membershipId_organizationId_fkey" FOREIGN KEY ("membershipId", "organizationId") REFERENCES "Membership"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AssistantTurnTiming_id_organizationId_key" ON "AssistantTurnTiming"("id", "organizationId");
CREATE UNIQUE INDEX "AssistantTurnTiming_organizationId_requestId_key" ON "AssistantTurnTiming"("organizationId", "requestId");
CREATE INDEX "AssistantTurnTiming_organizationId_completedAt_idx" ON "AssistantTurnTiming"("organizationId", "completedAt");
