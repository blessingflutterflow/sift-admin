import { getAdminDb, getAdminBucket } from "@/lib/firebaseAdmin";

export type VerificationRow = {
  uid: string;
  name: string;
  phone: string;
  score: number;
  idUrl: string | null;
  selfieUrl: string | null;
};

/** Riders whose face-match landed in the manual-review band (60–84%). */
export async function loadPendingVerifications(): Promise<VerificationRow[]> {
  const snap = await getAdminDb()
    .collection("users")
    .where("verificationStatus", "==", "pending")
    .limit(50)
    .get();

  const bucket = getAdminBucket();
  const signed = async (uid: string, kind: string): Promise<string | null> => {
    try {
      const [url] = await bucket
        .file(`verifications/${uid}/${kind}.jpg`)
        .getSignedUrl({ action: "read", expires: Date.now() + 60 * 60 * 1000 });
      return url;
    } catch {
      return null;
    }
  };

  return Promise.all(
    snap.docs.map(async (d) => {
      const x = d.data() as Record<string, unknown>;
      const [idUrl, selfieUrl] = await Promise.all([
        signed(d.id, "id"),
        signed(d.id, "selfie"),
      ]);
      return {
        uid: d.id,
        name: String(x.name ?? "Rider"),
        phone: String(x.phone ?? ""),
        score: Number(x.faceMatchScore ?? 0),
        idUrl,
        selfieUrl,
      };
    })
  );
}
