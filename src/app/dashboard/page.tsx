"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { 
  Zap, 
  Upload, 
  Calendar, 
  Send, 
  CheckCircle, 
  Clock, 
  Play,
  Settings,
  LogOut,
  User,
  BarChart3,
  Video,
  Link as LinkIcon,
  Wifi,
  WifiOff,
  CalendarDays,
  History,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { signOut } from "@/lib/auth"

interface Platform {
  id: string
  name: string
  icon: string
  color: string
  connected: boolean
}

interface Publication {
  id: string
  title: string
  description: string
  date: string
  scheduledDate?: string
  platforms: string[]
  status: 'published' | 'scheduled' | 'failed'
  views?: number
  engagement?: number
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['tiktok', 'youtube', 'instagram'])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishType, setPublishType] = useState<'now' | 'schedule'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [platforms, setPlatforms] = useState<Platform[]>([
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      color: 'bg-black',
      connected: true
    },
    {
      id: 'youtube',
      name: 'YouTube Shorts',
      icon: '▶️',
      color: 'bg-red-600',
      connected: true
    },
    {
      id: 'instagram',
      name: 'Instagram Reels',
      icon: '📸',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      connected: false
    }
  ])

  const [publications, setPublications] = useState<Publication[]>([
    {
      id: '1',
      title: "Como criar conteúdo viral em 2024",
      description: "Dicas essenciais para viralizar nas redes sociais #viral #conteudo #dicas",
      date: "2024-01-15T14:30:00",
      platforms: ['tiktok', 'youtube', 'instagram'],
      status: 'published',
      views: 125000,
      engagement: 8.5
    },
    {
      id: '2',
      title: "5 Dicas de produtividade para criadores",
      description: "Maximize seu tempo e crie mais conteúdo #produtividade #criadores #tips",
      date: "2024-01-14T10:15:00",
      platforms: ['tiktok', 'youtube'],
      status: 'published',
      views: 89000,
      engagement: 6.2
    },
    {
      id: '3',
      title: "Tutorial completo de edição de vídeo",
      description: "Aprenda a editar como um profissional #edicao #tutorial #video",
      date: "2024-01-13T16:45:00",
      platforms: ['youtube', 'instagram'],
      status: 'published',
      views: 67000,
      engagement: 9.1
    },
    {
      id: '4',
      title: "Tendências que vão dominar 2024",
      description: "Fique por dentro das próximas tendências #tendencias #2024 #futuro",
      date: "2024-01-12T09:00:00",
      scheduledDate: "2024-01-20T18:00:00",
      platforms: ['tiktok', 'youtube', 'instagram'],
      status: 'scheduled'
    },
    {
      id: '5',
      title: "Estratégias de crescimento orgânico",
      description: "Como crescer sem pagar por anúncios #crescimento #organico #estrategia",
      date: "2024-01-11T12:30:00",
      scheduledDate: "2024-01-18T15:30:00",
      platforms: ['tiktok', 'instagram'],
      status: 'scheduled'
    }
  ])

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file)
      setIsUploading(true)
      
      // Simular upload com progress
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setUploadProgress(progress)
        if (progress >= 100) {
          clearInterval(interval)
          setIsUploading(false)
        }
      }, 200)
    }
  }

  const togglePlatform = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId)
    if (platform?.connected) {
      setSelectedPlatforms(prev => 
        prev.includes(platformId) 
          ? prev.filter(id => id !== platformId)
          : [...prev, platformId]
      )
    }
  }

  const togglePlatformConnection = (platformId: string) => {
    setPlatforms(prev => prev.map(platform => 
      platform.id === platformId 
        ? { ...platform, connected: !platform.connected }
        : platform
    ))
    
    // Remove from selected if disconnected
    if (selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms(prev => prev.filter(id => id !== platformId))
    }
  }

  const handlePublishNow = () => {
    setIsPublishing(true)
    
    const newPublication: Publication = {
      id: Date.now().toString(),
      title,
      description,
      date: new Date().toISOString(),
      platforms: selectedPlatforms,
      status: 'published',
      views: Math.floor(Math.random() * 50000) + 10000,
      engagement: Math.floor(Math.random() * 10) + 3
    }
    
    setTimeout(() => {
      setPublications(prev => [newPublication, ...prev])
      setIsPublishing(false)
      setTitle("")
      setDescription("")
      setVideoFile(null)
      alert('Vídeo publicado com sucesso em todas as plataformas selecionadas!')
    }, 3000)
  }

  const handleSchedulePost = () => {
    if (!scheduledDate || !scheduledTime) {
      alert('Por favor, selecione data e hora para agendamento')
      return
    }

    setIsPublishing(true)
    
    const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`
    const newPublication: Publication = {
      id: Date.now().toString(),
      title,
      description,
      date: new Date().toISOString(),
      scheduledDate: scheduledDateTime,
      platforms: selectedPlatforms,
      status: 'scheduled'
    }
    
    setTimeout(() => {
      setPublications(prev => [newPublication, ...prev])
      setIsPublishing(false)
      setTitle("")
      setDescription("")
      setVideoFile(null)
      setScheduledDate("")
      setScheduledTime("")
      alert('Publicação agendada com sucesso!')
    }, 2000)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPlatformIcon = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId)
    return platform?.icon || '📱'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Publicado'
      case 'scheduled': return 'Agendado'
      case 'failed': return 'Falhou'
      default: return 'Desconhecido'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                MultiPost AI
              </span>
              <p className="text-xs text-gray-500 -mt-1">Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {user && (
              <div className="hidden sm:flex items-center space-x-3 mr-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Painel de Publicação
          </h1>
          <p className="text-lg text-gray-600">
            Publique seu conteúdo em todas as redes sociais com apenas um clique 🚀
          </p>
        </div>

        <Tabs defaultValue="publish" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 max-w-md bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="publish" className="data-[state=active]:bg-white">
              <Upload className="w-4 h-4 mr-2" />
              Publicar
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Análises
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="publish" className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Upload Section */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                      <Upload className="w-6 h-6 mr-3 text-purple-600" />
                      Upload do Vídeo
                    </CardTitle>
                    <CardDescription className="text-base">
                      Faça upload do seu vídeo (MP4, MOV, AVI - máx 500MB)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!videoFile ? (
                      <div className="border-2 border-dashed border-purple-300 rounded-xl p-12 text-center hover:border-purple-400 transition-all duration-300 hover:bg-purple-50/50">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-6">
                            <Video className="w-8 h-8 text-purple-600" />
                          </div>
                          <p className="text-xl font-semibold text-gray-900 mb-2">
                            Arraste seu vídeo aqui
                          </p>
                          <p className="text-gray-500 mb-6 text-lg">
                            ou clique para selecionar
                          </p>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="video-upload"
                          />
                          <label htmlFor="video-upload">
                            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-3 h-auto">
                              Selecionar Vídeo
                            </Button>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-900 text-lg">{videoFile.name}</p>
                              <p className="text-green-600">
                                {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setVideoFile(null)}
                            className="border-green-300 text-green-700 hover:bg-green-50"
                          >
                            Remover
                          </Button>
                        </div>
                        
                        {isUploading && (
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm font-medium">
                              <span>Processando vídeo...</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-3" />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Content Details */}
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Detalhes do Conteúdo</CardTitle>
                    <CardDescription className="text-base">
                      Adicione título e descrição para suas publicações
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="title" className="text-base font-medium">Título</Label>
                      <Input
                        id="title"
                        placeholder="Digite o título do seu vídeo..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-14 text-lg border-gray-300 focus:border-purple-500"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="description" className="text-base font-medium">Descrição</Label>
                      <Textarea
                        id="description"
                        placeholder="Descreva seu vídeo, adicione hashtags relevantes..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[140px] resize-none text-base border-gray-300 focus:border-purple-500"
                      />
                      <p className="text-sm text-gray-500">
                        💡 Dica: Use hashtags relevantes para aumentar o alcance
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Platform Selection & Actions */}
              <div className="space-y-6">
                {/* Platform Connections */}
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                      <Wifi className="w-6 h-6 mr-3 text-purple-600" />
                      Redes Conectadas
                    </CardTitle>
                    <CardDescription className="text-base">
                      Gerencie suas conexões e selecione onde publicar
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {platforms.map((platform) => (
                      <div
                        key={platform.id}
                        className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                          platform.connected
                            ? selectedPlatforms.includes(platform.id)
                              ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer'
                            : 'border-gray-200 bg-gray-50 opacity-75'
                        }`}
                        onClick={() => platform.connected && togglePlatform(platform.id)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 ${platform.color} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                              {platform.icon}
                            </div>
                            <div>
                              <p className="font-semibold text-lg">{platform.name}</p>
                              <div className="flex items-center">
                                {platform.connected ? (
                                  <>
                                    <Wifi className="w-4 h-4 text-green-500 mr-2" />
                                    <span className="text-sm text-green-600 font-medium">Conectado</span>
                                  </>
                                ) : (
                                  <>
                                    <WifiOff className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-sm text-gray-500">Desconectado</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {platform.connected && selectedPlatforms.includes(platform.id) && (
                            <CheckCircle className="w-6 h-6 text-purple-600" />
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <Button
                            variant={platform.connected ? "destructive" : "default"}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              togglePlatformConnection(platform.id)
                            }}
                            className="text-xs"
                          >
                            {platform.connected ? 'Desconectar' : 'Conectar'}
                          </Button>
                          
                          {platform.connected && (
                            <div className="text-xs text-gray-500">
                              {selectedPlatforms.includes(platform.id) ? 'Selecionado' : 'Clique para selecionar'}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Publishing Options */}
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">Opções de Publicação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Publish Type Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="publish-now"
                            name="publishType"
                            value="now"
                            checked={publishType === 'now'}
                            onChange={(e) => setPublishType(e.target.value as 'now' | 'schedule')}
                            className="w-4 h-4 text-purple-600"
                          />
                          <Label htmlFor="publish-now" className="font-medium">Publicar agora</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="schedule"
                            name="publishType"
                            value="schedule"
                            checked={publishType === 'schedule'}
                            onChange={(e) => setPublishType(e.target.value as 'now' | 'schedule')}
                            className="w-4 h-4 text-purple-600"
                          />
                          <Label htmlFor="schedule" className="font-medium">Agendar</Label>
                        </div>
                      </div>

                      {/* Schedule Options */}
                      {publishType === 'schedule' && (
                        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="schedule-date" className="text-sm font-medium">Data</Label>
                              <Input
                                id="schedule-date"
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="schedule-time" className="text-sm font-medium">Hora</Label>
                              <Input
                                id="schedule-time"
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {publishType === 'now' ? (
                        <Button 
                          className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg font-semibold shadow-lg"
                          onClick={handlePublishNow}
                          disabled={!videoFile || !title || selectedPlatforms.length === 0 || isPublishing}
                        >
                          {isPublishing ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                              Publicando...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-3" />
                              Publicar Agora
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button 
                          className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg font-semibold shadow-lg"
                          onClick={handleSchedulePost}
                          disabled={!videoFile || !title || selectedPlatforms.length === 0 || isPublishing}
                        >
                          {isPublishing ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                              Agendando...
                            </>
                          ) : (
                            <>
                              <CalendarDays className="w-5 h-5 mr-3" />
                              Agendar Publicação
                            </>
                          )}
                        </Button>
                      )}
                      
                      <div className="text-center pt-2">
                        <p className="text-sm text-gray-600 font-medium">
                          {selectedPlatforms.length} plataforma(s) selecionada(s)
                        </p>
                        <div className="flex justify-center space-x-2 mt-2">
                          {selectedPlatforms.map(platformId => (
                            <span key={platformId} className="text-lg">
                              {getPlatformIcon(platformId)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Vídeos Publicados
                  </CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">127</div>
                  <p className="text-xs text-muted-foreground">
                    +12% em relação ao mês passado
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Alcance Total
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.4M</div>
                  <p className="text-xs text-muted-foreground">
                    +25% em relação ao mês passado
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Engajamento
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8.2%</div>
                  <p className="text-xs text-muted-foreground">
                    +3.1% em relação ao mês passado
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tempo Economizado
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23h</div>
                  <p className="text-xs text-muted-foreground">
                    Este mês
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Desempenho por Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {platforms.map((platform) => (
                    <div key={platform.id} className="flex items-center justify-between p-6 border rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 ${platform.color} rounded-xl flex items-center justify-center text-white text-lg shadow-lg`}>
                          {platform.icon}
                        </div>
                        <span className="font-semibold text-lg">{platform.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl">
                          {platform.id === 'tiktok' ? '850K' : platform.id === 'youtube' ? '1.2M' : '380K'}
                        </div>
                        <div className="text-sm text-gray-500">visualizações</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-8">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <History className="w-6 h-6 mr-3 text-purple-600" />
                  Histórico de Publicações
                </CardTitle>
                <CardDescription className="text-base">
                  Acompanhe todas as suas publicações e agendamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {publications.map((publication) => (
                    <div key={publication.id} className="flex items-center justify-between p-6 border rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center group-hover:from-purple-200 group-hover:to-blue-200 transition-colors">
                          <Play className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-lg text-gray-900">{publication.title}</p>
                          <p className="text-sm text-gray-600 max-w-md truncate">{publication.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{formatDate(publication.date)}</span>
                            {publication.scheduledDate && publication.status === 'scheduled' && (
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                Agendado para {formatDate(publication.scheduledDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        {/* Platform Icons */}
                        <div className="flex space-x-2">
                          {publication.platforms.map(platformId => (
                            <div key={platformId} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-sm">{getPlatformIcon(platformId)}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Status Badge */}
                        <Badge className={`${getStatusColor(publication.status)} border-0 px-3 py-1 font-medium`}>
                          {getStatusText(publication.status)}
                        </Badge>
                        
                        {/* Metrics */}
                        {publication.status === 'published' && (
                          <div className="text-right space-y-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Eye className="w-4 h-4 mr-1" />
                              {publication.views?.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {publication.engagement}% engajamento
                            </div>
                          </div>
                        )}
                        
                        {/* Actions */}
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {publications.length === 0 && (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg text-gray-500">Nenhuma publicação encontrada</p>
                    <p className="text-gray-400">Suas publicações aparecerão aqui</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}