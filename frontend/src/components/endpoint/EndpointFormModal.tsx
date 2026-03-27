import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { endpointsApi, type MockEndpoint } from '../../api/endpoints'
import { Button, Input, Modal, Select, Textarea } from '../ui'

const METHOD_OPTIONS = ['GET','POST','PUT','PATCH','DELETE','OPTIONS'].map((m) => ({ value: m, label: m }))

interface FormData {
  name: string; path: string; method: string; description: string; is_active: boolean
}

interface Props {
  workspaceId: string
  endpoint?: MockEndpoint
  onClose: () => void
}

export default function EndpointFormModal({ workspaceId, endpoint, onClose }: Props) {
  const qc = useQueryClient()
  const isEdit = !!endpoint

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: endpoint?.name ?? '',
      path: endpoint?.path ?? '/',
      method: endpoint?.method ?? 'GET',
      description: endpoint?.description ?? '',
      is_active: endpoint?.is_active ?? true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit
        ? endpointsApi.update(endpoint!.id, data)
        : endpointsApi.create({ ...data, workspace: workspaceId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['endpoints'] })
      toast.success(isEdit ? 'Endpoint updated' : 'Endpoint created')
      onClose()
    },
    onError: (err: any) => {
      const detail = err?.response?.data
      if (typeof detail === 'object') {
        Object.entries(detail).forEach(([k, v]) => toast.error(`${k}: ${v}`))
      } else {
        toast.error('Failed to save endpoint')
      }
    },
  })

  return (
    <Modal open title={isEdit ? 'Edit endpoint' : 'New endpoint'} onClose={onClose} size="md">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <Select
              label="Method"
              options={METHOD_OPTIONS}
              {...register('method')}
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Path"
              placeholder="/users/:id"
              error={errors.path?.message}
              {...register('path', {
                required: 'Path is required',
                validate: (v) => v.startsWith('/') || 'Must start with /',
              })}
            />
          </div>
        </div>

        <Input
          label="Name"
          placeholder="Get user by ID"
          error={errors.name?.message}
          {...register('name', { required: 'Name is required' })}
        />

        <Textarea
          label="Description"
          placeholder="What does this endpoint do?"
          rows={2}
          {...register('description')}
        />

        <div className="flex items-center gap-2 pt-1">
          <input type="checkbox" id="is_active" {...register('is_active')} className="w-3.5 h-3.5 accent-accent" />
          <label htmlFor="is_active" className="text-sm text-slate-400 cursor-pointer">Active</label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={mutation.isPending} className="flex-1">
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
