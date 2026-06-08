import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TransferTaxListClient } from "@/components/newTransfertax/TransferTaxListClient";

export default async function ViewTransferTaxListPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const user = {
        name: session.user.name || "User",
        email: session.user.email || "",
        avatar: "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        role: (session.user as any).role || "USER",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        designation: (session.user as any).designation || "DESIGNATION",
    };

    return <TransferTaxListClient user={user} />;
}
