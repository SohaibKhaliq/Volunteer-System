import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser'

export interface UploadedFileInfo {
  originalName: string
  storedName: string
  path: string
}

export interface FileUploadOptions {
  maxSizeBytes?: number
  allowedExtensions?: string[]
  directory?: string
  disk?: string
}

/**
 * File Upload Helper
 * Provides reusable file upload validation and handling
 */
export default class FileUploadHelper {
  private static readonly DEFAULT_MAX_SIZE = 5 * 1024 * 1024 // 5MB
  private static readonly DEFAULT_EXTENSIONS = ['png', 'jpg', 'jpeg', 'pdf', 'txt', 'doc', 'docx']

  /**
   * Validate and upload files
   */
  public static async validateAndUpload(
    files: MultipartFileContract[],
    options: FileUploadOptions = {}
  ): Promise<{ success: boolean; files?: UploadedFileInfo[]; error?: string }> {
    const maxSize = options.maxSizeBytes || this.DEFAULT_MAX_SIZE
    const allowedExt = options.allowedExtensions || this.DEFAULT_EXTENSIONS
    const directory = options.directory || 'uploads'
    const disk = options.disk || 'local'

    const placedFiles: UploadedFileInfo[] = []

    try {
      for (const file of files) {
        if (!file) continue

        // Validate file size
        if (file.size && file.size > maxSize) {
          return {
            success: false,
            error: `File exceeds maximum size of ${maxSize / (1024 * 1024)}MB`
          }
        }

        // Validate file extension
        const ext = (file.extname || '').toLowerCase()
        if (ext && !allowedExt.includes(ext)) {
          return {
            success: false,
            error: `File type "${ext}" is not allowed. Allowed types: ${allowedExt.join(', ')}`
          }
        }

        // Move file to disk
        await file.moveToDisk(disk, { dirname: directory })

        placedFiles.push({
          originalName: file.clientName || '',
          storedName: file.fileName || '',
          path: `${directory}/${file.fileName}`
        })
      }

      return { success: true, files: placedFiles }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to upload files. Please try again.'
      }
    }
  }

  /**
   * Validate single file
   */
  public static async validateAndUploadSingle(
    file: MultipartFileContract | null | undefined,
    options: FileUploadOptions = {}
  ): Promise<{ success: boolean; file?: UploadedFileInfo; error?: string }> {
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    const result = await this.validateAndUpload([file], options)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, file: result.files?.[0] }
  }

  /**
   * Get allowed extensions as a formatted string
   */
  public static getAllowedExtensionsString(extensions?: string[]): string {
    const exts = extensions || this.DEFAULT_EXTENSIONS
    return exts.join(', ')
  }

  /**
   * Format file size in human-readable format
   */
  public static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * Parse files from JSON string
   */
  public static parseFilesJson(filesJson: string | null): UploadedFileInfo[] {
    if (!filesJson) return []

    try {
      const parsed = JSON.parse(filesJson)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  /**
   * Serialize files to JSON string
   */
  public static serializeFiles(files: UploadedFileInfo[]): string {
    return JSON.stringify(files)
  }
}
