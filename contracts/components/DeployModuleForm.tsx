"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { encodeFunctionData, parseAbiParameters } from "viem";
import { useTemplates } from "../hooks/useTemplates";
import { useProjects } from "../hooks/useProjects";
import { deploymentManagerAddress, auditRegistryAddress } from "../constants";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

import AuditRegistryAbi from "../../../abi/AuditRegistry.json";
const { deploymentManagerAbi } = require("../abi/DeploymentManager.json");

export const DeployModuleForm = ({ preselectedTemplateId }) => {
  const { templates, loading: loadingTemplates } = useTemplates();
  const { projects, refetch: refetchProjects } = useProjects();
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [initJson, setInitJson] = useState("{}");
  const [metadata, setMetadata] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [jsonError, setJsonError] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [isAudited, setIsAudited] = useState(null);

  const categoryIcons = {
    DAO: "🏛️",
    DeFi: "💸",
    NFT: "🎨",
    Utility: "🛠️",
    GameFi: "🎮",
    Uncategorized: "❓",
  };

  const categoryDescriptions = {
    DAO: "Decentralized governance & proposal voting modules",
    DeFi: "Finance-focused tools like staking, swaps, or lending",
    NFT: "Modules for minting, trading, or managing NFTs",
    Utility: "General-purpose helpers or extensions",
    GameFi: "Modules for games and in-game economies",
    Uncategorized: "Category not assigned",
  };

  const categoryInitDefaults = {
    // Replace keys with real templateIds (example placeholders here)
    "0x123...": JSON.stringify({ name: "MyDAO" }, null, 2),
    "0x456...": JSON.stringify({ token: "MODL", feeRate: 0.01 }, null, 2),
    "0x789...": JSON.stringify({ collectionName: "MyNFTs", symbol: "MNFT" }, null, 2),
  };

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.templateId === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  // Auto-select preselected template
  useEffect(() => {
    if (preselectedTemplateId) {
      setSelectedTemplateId(preselectedTemplateId);
    }
  }, [preselectedTemplateId]);

  // Load init defaults
  useEffect(() => {
    if (selectedTemplateId && categoryInitDefaults[selectedTemplateId]) {
      setInitJson(categoryInitDefaults[selectedTemplateId]);
    }
  }, [selectedTemplateId]);

  // Check audit status
  useEffect(() => {
    const checkAudit = async () => {
      if (!selectedTemplateId) return setIsAudited(null);
      try {
        const result = await publicClient.readContract({
          address: auditRegistryAddress,
          abi: AuditRegistryAbi,
          functionName: "isAudited",
          args: [selectedTemplateId],
        });
        setIsAudited(result);
      } catch (err) {
        console.warn("Audit fetch failed:", err);
        setIsAudited(null);
      }
    };
    checkAudit();
  }, [selectedTemplateId, publicClient]);

  const handleDeploy = async () => {
    if (!walletClient || !selectedTemplateId || !selectedProjectId) return;

    setSubmitting(true);
    setTxHash("");
    setJsonError(null);

    try {
      toast.loading("Deploying module...");

      let initData = "0x";

      if (initJson.trim() !== "") {
        try {
          const parsed = JSON.parse(initJson);
          setJsonError(null);

          const abiParams = parseAbiParameters("string name");
          initData = encodeFunctionData({
            abi: [
              {
                type: "function",
                name: "init",
                stateMutability: "nonpayable",
                inputs: abiParams,
              },
            ],
            functionName: "init",
            args: [parsed.name],
          });
        } catch (jsonErr) {
          setJsonError("❌ Invalid JSON: Please check your syntax.");
          toast.dismiss();
          setSubmitting(false);
          return;
        }
      }

      const tx = await walletClient.sendTransaction({
        account: address,
        to: deploymentManagerAddress,
        data: encodeFunctionData({
          abi: deploymentManagerAbi,
          functionName: "deployTemplateToProject",
          args: [
            BigInt(selectedProjectId),
            selectedTemplateId,
            initData,
            metadata || "",
          ],
        }),
      });

      toast.success("✅ Module deployed!");
      setTxHash(tx);
      await refetchProjects?.();
    } catch (err) {
      console.error("Deploy error:", err);
      toast.error(err?.shortMessage || "Deployment failed");
    } finally {
      setSubmitting(false);
      toast.dismiss();
    }
  };

  return (
    <div className="p-4 border rounded shadow space-y-4">
      <h2 className="text-xl font-bold">Deploy Module</h2>

      {/* Project Selector */}
      <label className="block">
        Project:
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full p-2 border rounded mt-1"
        >
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p.projectId} value={p.projectId}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      {/* Template Selector */}
      <label className="block">
        Template:
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="w-full p-2 border rounded mt-1"
          disabled={loadingTemplates}
        >
          <option value="">Select a template</option>
          {templates.map((t) => (
            <option key={t.templateId} value={t.templateId}>
              {t.name} (v{t.version}) {t.verified ? "✅" : "⚠️"}
            </option>
          ))}
        </select>
        {selectedTemplate && (
          <>
            <button
              onClick={() => setShowPreview((prev) => !prev)}
              className="text-sm text-blue-600 underline mt-2"
              aria-expanded={showPreview}
              aria-controls="template-details"
            >
              {showPreview ? "Hide" : "Show"} Template Details
            </button>

            <AnimatePresence>
              {showPreview && (
                <motion.div
                  key="template-drawer"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border rounded-md p-4 mt-2 bg-gray-50 text-sm space-y-2"
                >
                  <p><strong>Name:</strong> {selectedTemplate.name}</p>
                  <p><strong>Version:</strong> {selectedTemplate.version}</p>
                  <p><strong>Implementation:</strong> {selectedTemplate.implementation}</p>
                  <p>
                    <span
                      title={categoryDescriptions[selectedTemplate.category || "Uncategorized"]}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-200 rounded-full"
                    >
                      {categoryIcons[selectedTemplate.category || "Uncategorized"]}
                      {selectedTemplate.category || "Uncategorized"}
                    </span>
                  </p>
                  <p>
                    <strong>Audited:</strong>{" "}
                    {isAudited === null ? "Unknown" : isAudited ? "✅ Audited" : "⚠️ Not Audited"}
                  </p>
                  {selectedTemplate.description && (
                    <p><strong>Description:</strong> {selectedTemplate.description}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </label>

      {/* Init JSON */}
      <label className="block">
        Init JSON:
        <textarea
          value={initJson}
          onChange={(e) => setInitJson(e.target.value)}
          rows={3}
          className="w-full p-2 border rounded mt-1 font-mono text-sm"
        />
        {categoryInitDefaults[selectedTemplateId] && (
          <button
            type="button"
            onClick={() => setInitJson(categoryInitDefaults[selectedTemplateId])}
            className="text-xs text-blue-600 underline mt-1"
          >
            Reset to recommended default
          </button>
        )}
        {jsonError && (
          <p className="text-red-600 text-sm mt-1">{jsonError}</p>
        )}
      </label>

      {/* Metadata */}
      <label className="block">
        Metadata (optional):
        <input
          type="text"
          value={metadata}
          onChange={(e) => setMetadata(e.target.value)}
          className="w-full p-2 border rounded mt-1"
        />
      </label>

      {/* Deploy Button */}
      <button
        onClick={handleDeploy}
        disabled={submitting || !selectedTemplateId || !selectedProjectId}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {submitting ? "Deploying..." : "Deploy Module"}
      </button>

      {/* Transaction hash display */}
      {txHash && (
        <p className="text-sm text-green-600 mt-2">
          ✅ TX:{" "}
          <a
            href={`https://sepolia.basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {txHash.slice(0, 10)}...
          </a>
        </p>
      )}
    </div>
  );
};
