"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { templateRegistryAddress, auditRegistryAddress } from "../../constants";
import Link from "next/link";
import { formatAddress } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import TemplateRegistryArtifact from "../../abi/templateRegistry.json";
import AuditRegistryArtifact from "../../abi/AuditRegistry.json";

const TemplateRegistryAbi = TemplateRegistryArtifact.abi;
const AuditRegistryAbi = AuditRegistryArtifact.abi;

const categoryIcons = {
  DAO: "\ud83c\udfdb\ufe0f",
  DeFi: "\ud83d\udcb8",
  NFT: "\ud83c\udfa8",
  Utility: "\ud83d\udee0\ufe0f",
  GameFi: "\ud83c\udfae",
  Uncategorized: "\u2753",
};

const categoryDescriptions = {
  DAO: "Decentralized governance & proposal voting modules",
  DeFi: "Finance-focused tools like staking, swaps, or lending",
  NFT: "Modules for minting, trading, or managing NFTs",
  Utility: "General-purpose helpers or extensions",
  GameFi: "Modules for games and in-game economies",
  Uncategorized: "Category not assigned",
};

export default function TemplateList() {
  const publicClient = usePublicClient();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const count = await publicClient.readContract({
          address: templateRegistryAddress,
          abi: TemplateRegistryAbi,
          functionName: "getTemplateCount",
        });

        const ids = await Promise.all(
          Array(Number(count))
            .fill(null)
            .map((_, i) =>
              publicClient.readContract({
                address: templateRegistryAddress,
                abi: TemplateRegistryAbi,
                functionName: "getTemplateIdByIndex",
                args: [BigInt(i)],
              })
            )
        );

        const data = await Promise.all(
          ids.map(async (templateId) => {
            const template = await publicClient.readContract({
              address: templateRegistryAddress,
              abi: TemplateRegistryAbi,
              functionName: "getTemplate",
              args: [templateId],
            });

            const audited = await publicClient.readContract({
              address: auditRegistryAddress,
              abi: AuditRegistryAbi,
              functionName: "isAudited",
              args: [templateId],
            });

            return {
              id: templateId,
              audited,
              address: template,
              description: `Template ${templateId.slice(0, 6)}...`,
              category: "Uncategorized",
            };
          })
        );

        setTemplates(data);
      } catch (err) {
        console.error("Error loading templates:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="flex gap-2">
          {["all", "audited", "unaudited"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm border ${
                category === cat ? "bg-blue-500 text-white" : "bg-white text-gray-600"
              }`}
            >
              {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm"
          >
            <option value="recent">Recently Added</option>
            <option value="az">Alphabetical (A-Z)</option>
            <option value="audited">Audited First</option>
          </select>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6">Available Templates</h1>

      {loading ? (
        <p className="text-gray-500">Loading templates...</p>
      ) : templates.length === 0 ? (
        <p>No templates found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates
            .filter((tpl) => {
              if (category === "audited") return tpl.audited;
              if (category === "unaudited") return !tpl.audited;
              return true;
            })
            .sort((a, b) => {
              if (sortBy === "az") return a.id.localeCompare(b.id);
              if (sortBy === "audited") return (b.audited ? 1 : 0) - (a.audited ? 1 : 0);
              return 0;
            })
            .map((tpl, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <p className="text-sm text-gray-500">Template ID</p>
                  <p className="font-mono text-sm">{tpl.id}</p>

                  <p className="text-sm text-gray-500 mt-3">Contract</p>
                  <a
                    href={`https://sepolia.basescan.org/address/${tpl.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-sm hover:underline inline-flex items-center gap-1"
                  >
                    {formatAddress(tpl.address)} <ExternalLink size={12} />
                  </a>

                  <p className="text-sm text-gray-600 mt-3">
                    <span className="font-medium">Description:</span> {tpl.description}
                  </p>

                  <p className="text-sm mt-2">
                    <span className="font-medium">Category:</span>{" "}
                    <span
                      title={categoryDescriptions[tpl.category || "Uncategorized"]}
                      className="inline-flex items-center gap-1 px--2 py-0.5 text-xs font-medium bg-gray-200 rounded-full"
                    >
                      {categoryIcons[tpl.category || "Uncategorized"]} {tpl.category || "Uncategorized"}
                    </span>
                  </p>

                  {tpl.audited && (
                    <span className="inline-block mt-2 text-xs font-semibold text-green-600">
                      ✅ Audited
                    </span>
                  )}
                </div>

                <Link
                  href={`/dashboard?templateId=${tpl.id}`}
                  className="mt-4 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-md px-4 py-2 text-center"
                >
                  Use this template
                </Link>
              </div>
            ))}
        </div>
      )}
    </main>
  );
}
