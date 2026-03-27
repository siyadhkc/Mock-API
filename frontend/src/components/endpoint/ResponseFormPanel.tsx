import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { endpointsApi, type MockResponse } from '../../api/endpoints'
import { Button, Input, Select, Textarea } from '../ui'

const SOURCE_OPTIONS = [
  { value: 'body', label: 'Body' },
  { value: 'query', label: 'Query' },
  { value: 'header', label: 'Header' },
  { value: 'path', label: 'Path' },
]

const OPERATOR_OPTIONS = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'starts_with', label: 'starts with' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'exists', label: 'exists' },
  { value: 'not_exists', label: 'not exists' },
]

const BODY_TYPE_OPTIONS = [
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'text', label: 'Text' },
  { value: 'html', label: 'HTML' },
]

interface RuleForm {
  source: string; field: string; operator: string; value: string
}

interface FormData {
  name: string; status_code: number; body: string; body_type: string
  is_default: boolean; priority: number; rules: RuleForm[]
}

interface Props {
  endpointId: string
  onDone: () => void
}

export default function ResponseFormPanel({ endpointId, onDone }: Props) {
  const qc = useQueryClient()
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: 'Default', status_code: 200, body: '{\n  \n}',
      body_type: 'json', is_default: true, priority: 0, rules: [],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'rules' })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      endpointsApi.createResponse({
        ...data,
        endpoint: endpointId,
        status_code: Number(data.status_code),
        priority: Number(data.priority),
        headers: {},
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['endpoint', endpointId] })
      toast.success('Response added')
      onDone()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? 'Failed to create response')
    },
  })

  return (
    <div className="border border-accent/40 rounded-lg p-4 bg-surface-elevated space-y-4">
      <p className="text-sm font-medium text-slate-200">New response</p>

      <div className="grid grid-cols-3 gap-3">
        <Input label="Name" {...register('name', { required: true })} error={errors.name && 'Required'} />
        <Input label="Status" type="number" {...register('status_code')} />
        <Select label="Body type" options={BODY_TYPE_OPTIONS} {...register('body_type')} />
      </div>

      <Textarea
        label="Body"
        rows={6}
        className="text-xs"
        {...register('body')}
        placeholder='{ "id": 1, "name": "Alice" }'
      />

      {/* Rules */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wider text-slate-500">Match rules (AND logic)</p>
          <button
            type="button"
            onClick={() => append({ source: 'body', field: '', operator: 'eq', value: '' })}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
          >
            <Plus size={11} /> Add rule
          </button>
        </div>

        {fields.length === 0 && (
          <p className="text-xs text-slate-600 italic">No rules — this response always matches (or acts as default).</p>
        )}

        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={field.id} className="flex items-center gap-2">
              <Select
                options={SOURCE_OPTIONS}
                {...register(`rules.${i}.source`)}
                className="w-24 text-xs py-1.5"
              />
              <input
                placeholder="field"
                {...register(`rules.${i}.field`, { required: true })}
                className="flex-1 bg-surface border border-surface-border rounded-lg px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent"
              />
              <Select
                options={OPERATOR_OPTIONS}
                {...register(`rules.${i}.operator`)}
                className="w-28 text-xs py-1.5"
              />
              <input
                placeholder="value"
                {...register(`rules.${i}.value`)}
                className="flex-1 bg-surface border border-surface-border rounded-lg px-2 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent"
              />
              <button type="button" onClick={() => remove(i)} className="text-slate-600 hover:text-red-400 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_default" {...register('is_default')} className="accent-accent" />
        <label htmlFor="is_default" className="text-xs text-slate-400 cursor-pointer">Default response (fallback when no rule matches)</label>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" loading={mutation.isPending} onClick={handleSubmit((d) => mutation.mutate(d))}>
          Save response
        </Button>
      </div>
    </div>
  )
}
