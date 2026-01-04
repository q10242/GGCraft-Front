import api from './api'

export interface UploadAvatarResponse {
  path: string
  url: string
  scope: 'user' | 'team'
}

export const uploadService = {
  async uploadAvatar(payload: { file: File; scope: 'user' | 'team'; referenceId?: number | string }) {
    const form = new FormData()
    form.append('file', payload.file)
    form.append('scope', payload.scope)
    if (payload.referenceId !== undefined) {
      form.append('reference_id', String(payload.referenceId))
    }
    const { data } = await api.post<UploadAvatarResponse>('/uploads/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
