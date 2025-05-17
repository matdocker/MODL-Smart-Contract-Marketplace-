'use client'

import { useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { templateRegistryAddress } from '@/constants/index'
import TEMPLATE_REGISTRY_ABI from '@/abi/TemplateRegistry.json'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Abi } from 'viem'
import { toast } from 'react-hot-toast'
import { useTierSystem } from '@/hooks/useTierSystem'

const categories = ['DAO', 'DeFi', 'NFT', 'Utility', 'GameFi']

export function RegisterTemplateModal({ refreshTemplates }: { refreshTemplates: () => void }) {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { tier } = useTierSystem()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [category, setCategory] = useState('Utility')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!address || !walletClient) return

    if (tier < 1) {
      toast.error('You must be Tier 1 or higher to register templates.')
      return
    }

    setLoading(true)
    try {
      const categoryIndex = categories.indexOf(category)

      const fee = await publicClient.readContract({
        address: templateRegistryAddress,
        abi: TEMPLATE_REGISTRY_ABI.abi as Abi,
        functionName: 'getRegistrationFee',
      })

      const { request } = await publicClient.simulateContract({
        address: templateRegistryAddress,
        abi: TEMPLATE_REGISTRY_ABI.abi as Abi,
        functionName: 'registerTemplate',
        account: address,
        args: [address, name, version, categoryIndex, fee],
        value: fee,
      })

      const txHash = await walletClient.writeContract(request)
      await publicClient.waitForTransactionReceipt({ hash: txHash })

      toast.success(`✅ "${name}" v${version} registered!`)

      // 🔄 Refresh templates after success
      if (refreshTemplates) {
        refreshTemplates()
      }

      setOpen(false)
      setName('')
      setVersion('1.0.0')
    } catch (err: any) {
      console.error(err)
      const message = err?.shortMessage || err?.message || 'Registration failed'
      toast.error(`❌ ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Register New Template</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register New Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Version</Label>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>
          <div>
            <Label>Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm w-full"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleRegister}
            disabled={loading || !name || !version}
            className="w-full"
          >
            {loading ? 'Registering...' : 'Submit Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
