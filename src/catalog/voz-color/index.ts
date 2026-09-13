import { registerCatalog, type CatalogRegistry } from '../../a2ui/registry';
import { AudioPlayer } from '../standard/AudioPlayer';
import { Card } from '../standard/Card';
import { CheckBox } from '../standard/CheckBox';
import { ChoicePicker } from '../standard/ChoicePicker';
import { DateTimeInput } from '../standard/DateTimeInput';
import { Icon } from '../standard/Icon';
import { Image } from '../standard/Image';
import { Column, Divider, List, Row } from '../standard/layout';
import { Modal } from '../standard/Modal';
import { Slider } from '../standard/Slider';
import { Tabs } from '../standard/Tabs';
import { TextField } from '../standard/TextField';
import { Video } from '../standard/Video';
import { Badge } from '../standard/Badge';
import { Heading } from '../standard/Heading';
import { LoanOffer } from '../standard/LoanOffer';
import { ProgressBar } from '../standard/ProgressBar';
import { Button } from './Button';
import { Text } from './Text';

/**
 * The accessible catalog (REQ-ACC-02): high contrast, icon-first, large
 * targets. Implements the SAME node-type vocabulary as catalog/standard —
 * enforced by CatalogRegistry's closed type, not by convention.
 *
 * Only `Text` and `Button` have accessible-specific variants so far (the two
 * highest-impact surfaces for low-vision/low-literacy users: font scale and
 * tap-target size). Everything else re-exports the standard implementation
 * for now — TODO before the accessible-persona demo (REQ-DEMO-03): give
 * TextField, CheckBox, and ChoicePicker the same accessibleTypography /
 * accessibleMinTouchTarget treatment as Button, once the standard set has
 * been exercised against real backend payloads and the pattern is proven.
 */
const vozColorCatalog: CatalogRegistry = {
  Text,
  Image,
  Icon,
  Video,
  AudioPlayer,
  Row,
  Column,
  List,
  Card,
  Tabs,
  Modal,
  Divider,
  Button,
  TextField,
  CheckBox,
  ChoicePicker,
  Slider,
  DateTimeInput,
  Heading,
  Badge,
  ProgressBar,
  LoanOffer,
};


registerCatalog('voz-color', vozColorCatalog);

export { vozColorCatalog };
