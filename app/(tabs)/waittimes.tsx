import SwipeableRow from '@/components/SwipeableRow'
import Colors from '@/constants/Colors'
import { PARKS } from '@/constants/parks'
import { useAuth } from '@/context/AuthContext'
import { useFavourites } from '@/hooks/useFavourites'
import { haptic } from '@/lib/haptics'
import { getTrips } from '@/services/trips'
import {
  LiveAttraction,
  LiveCharacterMeet,
  LiveShow,
  ParkHours,
  fetchLiveCharacterMeets,
  fetchLiveShows,
  fetchLiveWaitTimes,
  fetchParkSchedule,
} from '@/services/waitTimes'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from 'nativewind'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

type ParkOption = typeof PARKS[number]
type DataTab = 'attractions' | 'shows' | 'characters'

const formatTime = (iso: string) => {
  if (!iso) return ''
  const timePart = iso.includes('T') ? iso.split('T')[1] : iso
  const [hourStr, minuteStr] = timePart.split(':')
  const hour = parseInt(hourStr, 10)
  const minute = minuteStr.padStart(2, '0')
  const period = hour >= 12 ? 'pm' : 'am'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minute} ${period}`
}
export default function WaitTimes() {
  const { user } = useAuth()

  const [tripParks, setTripParks] = useState<ParkOption[]>([])
  const [browseParks, setBrowseParks] = useState<ParkOption[]>([])
  const [isBrowsing, setIsBrowsing] = useState(false)
  const [selectedPark, setSelectedPark] = useState<ParkOption | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<DataTab>('attractions')

  const [attractions, setAttractions] = useState<LiveAttraction[]>([])
  const [shows, setShows] = useState<LiveShow[]>([])
  const [characterMeets, setCharacterMeets] = useState<LiveCharacterMeet[]>([])
  const [todayHours, setTodayHours] = useState<ParkHours | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const { isFavourite, toggleFavourite } = useFavourites(user?.$id, selectedPark?.id)

  const { colorScheme } = useColorScheme()
const theme = colorScheme === 'dark' ? Colors.dark : Colors.light

useEffect(() => {
  if (!user) return
  getTrips(user.$id).then((trips) => {
    const now = new Date()
    const upcoming = trips
      .filter(t => new Date(t.startDate) >= now || t.status === 'active')
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    const nextTrip = upcoming[0] ?? trips[0]

    if (nextTrip && nextTrip.parks.length > 0) {
      // Trip mode
      const parks = nextTrip.parks
        .map(id => PARKS.find(p => p.id === id))
        .filter((p): p is ParkOption => p !== undefined)
      setTripParks(parks)
      setSelectedPark(parks[0])
      setIsBrowsing(false)
    } else {
      // Browsing mode — pick 3 random parks, select one
      const shuffled = [...PARKS].sort(() => Math.random() - 0.5)
      const randomParks = shuffled.slice(0, 3)
      setBrowseParks(randomParks)
      setSelectedPark(randomParks[0])
      setIsBrowsing(true)
    }
  }).catch(console.error)
}, [user])

useEffect(() => {
  if (!selectedPark) {
    setAttractions([])
    setShows([])
    setCharacterMeets([])
    setTodayHours(null)
    return
  }
  setActiveTab('attractions')
  loadAllData()
}, [selectedPark])

  const loadAllData = async (isRefresh = false) => {
    if (!selectedPark?.entityId) return
    isRefresh ? setRefreshing(true) : setLoading(true)
    setError('')
    try {
      const [liveAttractions, liveShows, liveCharacterMeets, schedule] = await Promise.all([
        fetchLiveWaitTimes(selectedPark.entityId),
        fetchLiveShows(selectedPark.entityId),
        fetchLiveCharacterMeets(selectedPark.entityId),
        fetchParkSchedule(selectedPark.entityId),
      ])
      setAttractions(liveAttractions)
      setShows(liveShows)
      setCharacterMeets(liveCharacterMeets)
      const today = new Date().toISOString().split('T')[0]
      setTodayHours(schedule.find(s => s.date === today) ?? null)
      setLastUpdated(new Date())
    } catch (e) {
      setError('Could not load data. Check your connection.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const operating = attractions.filter(a => a.status === 'OPERATING')
  const unavailable = attractions.filter(a => a.status !== 'OPERATING')
  const hasCharacterMeets = characterMeets.length > 0
  const tabs: DataTab[] = ['attractions', 'shows', ...(hasCharacterMeets ? ['characters' as DataTab] : [])]

  const allResorts = PARKS.reduce((acc, park) => {
    if (!acc[park.resort]) acc[park.resort] = []
    acc[park.resort].push(park)
    return acc
  }, {} as Record<string, ParkOption[]>)

  const activeData = () => {
    const data = activeTab === 'attractions' ? [...operating, ...unavailable]
      : activeTab === 'shows' ? shows
      : characterMeets
    return [
      ...data.filter(item => isFavourite(item.id)),
      ...data.filter(item => !isFavourite(item.id)),
    ]
  }

  const favBackground = (favourited: boolean) =>
    favourited ? theme.elevated : theme.surface

  const renderAttraction = ({ item }: { item: LiveAttraction }) => {
    const favourited = isFavourite(item.id)
    return (
      <SwipeableRow
        key={item.id}
        marginBottom={8}
        actions={[{
          icon: favourited ? 'heart-dislike' : 'heart',
          color: favourited ? '#FF4D4D20' : `${selectedPark?.color ?? theme.accent}20`,
          textColor: favourited ? '#FF4D4D' : selectedPark?.color ?? theme.accent,
          onPress: () => toggleFavourite(item.id, 'ATTRACTION', item.name),
        }]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={() => { haptic(); toggleFavourite(item.id, 'ATTRACTION', item.name) }}
          style={{ backgroundColor: favBackground(favourited) }}
          className="rounded-xl px-4 py-3 mb-2 flex-row justify-between items-center"
        >
          <View className="flex-row items-center flex-1 mr-4">
            {favourited && (
              <Ionicons
                name="heart"
                size={12}
                color={selectedPark?.color ?? theme.accent}
                style={{ marginRight: 6 }}
              />
            )}
            <Text className="text-text text-sm flex-1" numberOfLines={1}>{item.name}</Text>
          </View>
          {item.status === 'OPERATING' ? (
            item.waitTime !== null ? (
              <Text style={{ color: selectedPark?.color ?? theme.accent }} className="font-bold text-base">
                {item.waitTime} <Text className="text-textSecondary text-xs font-normal">min</Text>
              </Text>
            ) : (
              <Text className="text-textSecondary text-sm">Walk on</Text>
            )
          ) : (
            <View className={`px-2 py-1 rounded-full ${item.status === 'DOWN' ? 'bg-yellow-500/20' : 'bg-border'}`}>
              <Text className={`text-xs font-medium ${item.status === 'DOWN' ? 'text-yellow-400' : 'text-textSecondary'}`}>
                {item.status === 'DOWN' ? 'Down' : 'Closed'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </SwipeableRow>
    )
  }

  const renderShow = ({ item }: { item: LiveShow }) => {
    const favourited = isFavourite(item.id)
    return (
      <SwipeableRow
        key={item.id}
        marginBottom={8}
        actions={[{
          icon: favourited ? 'heart-dislike' : 'heart',
          color: favourited ? '#FF4D4D20' : `${selectedPark?.color ?? theme.accent}20`,
          textColor: favourited ? '#FF4D4D' : selectedPark?.color ?? theme.accent,
          onPress: () => toggleFavourite(item.id, item.showType, item.name),
        }]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={() => { haptic(); toggleFavourite(item.id, item.showType, item.name) }}
          style={{ backgroundColor: favBackground(favourited) }}
          className="rounded-xl px-4 py-3 mb-2"
        >
          <View className="flex-row items-center mb-2">
            {favourited && (
              <Ionicons
                name="heart"
                size={12}
                color={selectedPark?.color ?? theme.accent}
                style={{ marginRight: 6 }}
              />
            )}
            <Text className="text-text text-sm font-medium">{item.name}</Text>
          </View>
          {item.showtimes.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {item.showtimes.map((time, index) => (
                <View key={index} style={{ backgroundColor: `${selectedPark?.color ?? theme.accent}20` }} className="px-3 py-1 rounded-full">
                  <Text style={{ color: selectedPark?.color ?? theme.accent }} className="text-xs font-semibold">
                    {formatTime(time)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-textSecondary text-xs">No more shows today</Text>
          )}
        </TouchableOpacity>
      </SwipeableRow>
    )
  }

  const renderCharacterMeet = ({ item }: { item: LiveCharacterMeet }) => {
    const favourited = isFavourite(item.id)
    return (
      <SwipeableRow
        key={item.id}
        marginBottom={8}
        actions={[{
          icon: favourited ? 'heart-dislike' : 'heart',
          color: favourited ? '#FF4D4D20' : `${selectedPark?.color ?? theme.accent}20`,
          textColor: favourited ? '#FF4D4D' : selectedPark?.color ?? theme.accent,
          onPress: () => toggleFavourite(item.id, 'CHARACTER_MEET', item.name),
        }]}
      >
<TouchableOpacity
  activeOpacity={1}
  onLongPress={() => { haptic(); toggleFavourite(item.id, 'CHARACTER_MEET', item.name) }}
  style={{ backgroundColor: favBackground(favourited) }}
  className={`rounded-xl px-4 py-3 mb-2 ${item.meetType === 'QUEUE' ? 'flex-row justify-between items-center' : ''}`}
>
  {item.meetType === 'QUEUE' ? (
    <>
      <View className="flex-row items-center flex-1 mr-4">
        {favourited && (
          <Ionicons
            name="heart"
            size={12}
            color={selectedPark?.color ?? theme.accent}
            style={{ marginRight: 6 }}
          />
        )}
        <Text className="text-text text-sm flex-1" numberOfLines={1}>{item.name}</Text>
      </View>
      {item.status === 'OPERATING' ? (
        item.waitTime !== null ? (
          <Text style={{ color: selectedPark?.color ?? theme.accent }} className="font-bold text-base">
            {item.waitTime} <Text className="text-textSecondary text-xs font-normal">min</Text>
          </Text>
        ) : (
          <Text className="text-textSecondary text-sm">Walk on</Text>
        )
      ) : (
        <View className={`px-2 py-1 rounded-full ${item.status === 'DOWN' ? 'bg-yellow-500/20' : 'bg-border'}`}>
          <Text className={`text-xs font-medium ${item.status === 'DOWN' ? 'text-yellow-400' : 'text-textSecondary'}`}>
            {item.status === 'DOWN' ? 'Down' : 'Closed'}
          </Text>
        </View>
      )}
    </>
  ) : (
    <>
      <View className="flex-row items-center mb-2">
        {favourited && (
          <Ionicons
            name="heart"
            size={12}
            color={selectedPark?.color ?? theme.accent}
            style={{ marginRight: 6 }}
          />
        )}
        <Text className="text-text text-sm font-medium">{item.name}</Text>
      </View>
      {item.showtimes.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {item.showtimes.map((time, index) => (
            <View key={index} style={{ backgroundColor: `${selectedPark?.color ?? theme.accent}20` }} className="px-3 py-1 rounded-full">
              <Text style={{ color: selectedPark?.color ?? theme.accent }} className="text-xs font-semibold">
                {formatTime(time)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-textSecondary text-xs">No more meets today</Text>
      )}
    </>
  )}
</TouchableOpacity>
      </SwipeableRow>
    )
  }

  const ParkHoursBar = () => {
    if (!todayHours?.openingTime) return null
    return (
      <View className="bg-surface rounded-xl px-4 py-3 mb-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-textSecondary text-xs">Opening Hours</Text>
          <Text className="text-text text-xs font-semibold">
            {formatTime(todayHours.openingTime)} – {formatTime(todayHours.closingTime)}
          </Text>
        </View>
        {todayHours.earlyEntry && (
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-textSecondary text-xs">Early Entry</Text>
            <Text className="text-text text-xs">
              {formatTime(todayHours.earlyEntry.openingTime)} – {formatTime(todayHours.earlyEntry.closingTime)}
            </Text>
          </View>
        )}
        {todayHours.specialEvent && (
          <View className="flex-row items-center justify-between">
            <Text className="text-yellow-400 text-xs">{todayHours.specialEvent.description}</Text>
            <Text className="text-yellow-400 text-xs">
              {formatTime(todayHours.specialEvent.openingTime)} – {formatTime(todayHours.specialEvent.closingTime)}
            </Text>
          </View>
        )}
      </View>
    )
  }

  const tabLabel = (tab: DataTab) => {
    if (tab === 'attractions') return 'Attractions'
    if (tab === 'shows') return 'Shows'
    return 'Characters'
  }

  const subtitleText = () => {
    if (activeTab === 'attractions') return `${operating.length} rides operating · ${lastUpdated ? `updated ${formatTime(lastUpdated.toISOString())}` : 'pull to refresh'}`
    if (activeTab === 'shows') return `${shows.length} shows & parades today`
    return `${characterMeets.length} character meets today`
  }

  const emptyText = () => {
    if (activeTab === 'attractions') return 'No wait time data available'
    if (activeTab === 'shows') return 'No shows scheduled today'
    return 'No character meets today'
  }

  const ListHeader = () => (
    <View>
      <ParkHoursBar />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row gap-2">
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{ backgroundColor: activeTab === tab ? (selectedPark?.color ?? theme.accent) : theme.surface }}
              className="px-4 py-2 rounded-full"
            >
              <Text style={{ color: activeTab === tab ? theme.background : theme.textSecondary }} className="text-sm font-semibold">
                {tabLabel(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <Text className="text-textSecondary text-xs mb-3">{subtitleText()}</Text>
    </View>
  )

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-4">
      <Text className="text-text text-2xl font-bold mb-4">Wait Times</Text>
{isBrowsing && (
  <Text className="text-textMuted text-xs mb-3">Browsing — no trips planned</Text>
)}
        <View className="flex-row items-center gap-2 mb-4">
  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
    <View className="flex-row gap-2">
      {(isBrowsing ? browseParks : tripParks).map(park => (
        <TouchableOpacity
          key={park.id}
          onPress={() => setSelectedPark(park)}
          style={{ backgroundColor: selectedPark?.id === park.id ? park.color : theme.surface }}
          className="px-4 py-2 rounded-full"
        >
          <Text style={{ color: selectedPark?.id === park.id ? theme.background : theme.textSecondary }} className="text-sm font-semibold">
            {park.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </ScrollView>
  <TouchableOpacity onPress={() => setModalVisible(true)} className="bg-surface px-3 py-2 rounded-full">
    <Text className="text-textSecondary text-sm">More</Text>
  </TouchableOpacity>
</View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={selectedPark?.color ?? theme.accent} />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-textSecondary text-sm text-center">{error}</Text>
          <TouchableOpacity onPress={() => loadAllData()} className="mt-4">
            <Text className="text-accent text-sm">Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList<LiveAttraction | LiveShow | LiveCharacterMeet>
          data={activeData()}
          keyExtractor={item => item.id}
          renderItem={
            activeTab === 'attractions' ? renderAttraction :
            activeTab === 'shows' ? renderShow :
            renderCharacterMeet as any
          }
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadAllData(true)}
              tintColor={selectedPark?.color ?? theme.accent}
            />
          }
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={
            <View className="items-center justify-center pt-12">
              <Text className="text-textSecondary text-sm">
                {!selectedPark ? 'Select a park to see wait times' : emptyText()}
              </Text>
              {!selectedPark && (
                <TouchableOpacity onPress={() => setModalVisible(true)} className="mt-4">
                  <Text style={{ color: theme.accent }} className="text-sm">Browse parks</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <ScrollView className="flex-1 bg-background">
          <View className="px-6 pt-12 pb-8">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-text font-bold text-base">All Parks</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text className="text-textSecondary">Close</Text>
              </TouchableOpacity>
            </View>
            {Object.entries(allResorts).map(([resort, parks]) => (
              <View key={resort} className="mb-6">
                <Text className="text-textSecondary text-xs mb-3">{resort}</Text>
                {parks.map(park => {
  const isInPills = isBrowsing
    ? browseParks.some(p => p.id === park.id)
    : selectedPark?.id === park.id

  return (
    <TouchableOpacity
      key={park.id}
      style={{ backgroundColor: isInPills ? theme.elevated : theme.surface }}
      className="flex-row items-center justify-between rounded-xl px-4 py-3 mb-2"
      onPress={() => {
        if (isBrowsing) {
          if (isInPills) {
            const updated = browseParks.filter(p => p.id !== park.id)
            setBrowseParks(updated)
            if (updated.length === 0) {
              setSelectedPark(null)
            } else if (selectedPark?.id === park.id) {
              setSelectedPark(updated[0])
            }
          } else {
            // Add to pills and select it
            setBrowseParks(prev => [...prev, park])
            setSelectedPark(park)
          }
        } else {
          setSelectedPark(park)
          setModalVisible(false)
        }
      }}
    >
      <View className="flex-row items-center gap-3">
        <View style={{ backgroundColor: park.color }} className="w-3 h-3 rounded-full" />
        <Text className="text-text text-sm">{park.name}</Text>
      </View>
      {isInPills && (
        <Text style={{ color: park.color }} className="text-sm font-bold">✓</Text>
      )}
    </TouchableOpacity>
  )
})}
              </View>
            ))}
          </View>
        </ScrollView>
      </Modal>
    </View>
  )
}