'use client'

import { useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { templateRegistryAddress } from '@/constants/index'
import TEMPLATE_REGISTRY_ABI from '@/abi/templateRegistry.json'
import { Button } from '@/components/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/dialog'
import { Input } from '@/components/input'
import { Label } from '@/components/label'
import { Abi } from 'viem'
import { toast } from 'react-hot-toast'

const categories = ['DAO', 'DeFi', 'NFT', 'Utility', 'GameFi']

export function RegisterTemplateModal() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [category, setCategory] = useState('Utility')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!address || !walletClient) return

    setLoading(true)
    try {
      const { request } = await publicClient.simulateContract({
        address: templateRegistryAddress,
        abi: TEMPLATE_REGISTRY_ABI.abi as Abi,
        functionName: 'registerTemplate',
        account: address,
        args: [address, name, version, 0], // fee = 0 (or customize if needed)
      })

      const txHash = await walletClient.writeContract(request)
      await publicClient.waitForTransactionReceipt({ hash: txHash })

      toast.success('Template registered!')
      setOpen(false)
      setName('')
      setVersion('1.0.0')
    } catch (err) {
      console.error(err)
      toast.error('Registration failed')
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
          <Button onClick={handleRegister} disabled={loading} className="w-full">
            {loading ? 'Registering...' : 'Submit Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
